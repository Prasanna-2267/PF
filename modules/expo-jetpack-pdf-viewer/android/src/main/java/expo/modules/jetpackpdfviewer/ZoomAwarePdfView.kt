package expo.modules.jetpackpdfviewer

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.pdf.PdfRenderer
import android.os.Handler
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.util.LruCache
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.View
import android.widget.OverScroller
import java.io.File
import java.util.concurrent.Executors
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min

internal class ZoomAwarePdfView(context: Context) : View(context) {
  private data class PageInfo(val width: Int, val height: Int)
  private data class TileKey(val page: Int, val scale: Int, val x: Int, val y: Int)

  private val mainHandler = Handler(Looper.getMainLooper())
  private val rendererExecutor = Executors.newSingleThreadExecutor()
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
  private val whitePaint = Paint().apply { color = Color.WHITE }
  private val scroller = OverScroller(context)
  private val tileSize = 768
  private val pageGap = 12f * resources.displayMetrics.density
  private val documentMargin = 10f * resources.displayMetrics.density
  private val pendingTiles = HashSet<TileKey>()
  private val tileCache = object : LruCache<TileKey, Bitmap>(48 * 1024) {
    override fun sizeOf(key: TileKey, value: Bitmap): Int = value.byteCount / 1024
    override fun entryRemoved(evicted: Boolean, key: TileKey, oldValue: Bitmap, newValue: Bitmap?) {
      if (oldValue !== newValue && !oldValue.isRecycled) oldValue.recycle()
    }
  }

  private var descriptor: ParcelFileDescriptor? = null
  private var renderer: PdfRenderer? = null
  private var pages: List<PageInfo> = emptyList()
  private var sourceFile: File? = null
  @Volatile private var activeScaleBucket = 100
  private var loadGeneration = 0
  private var baseScale = 1f
  private var zoom = 1f
  private var scrollXPosition = 0f
  private var scrollYPosition = 0f
  private var disposed = false
  private var onLoaded: ((Int) -> Unit)? = null
  private var onFailed: ((Throwable) -> Unit)? = null

  private val scaleDetector = ScaleGestureDetector(context, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
    override fun onScale(detector: ScaleGestureDetector): Boolean {
      val oldZoom = zoom
      val newZoom = (oldZoom * detector.scaleFactor).coerceIn(1f, 5f)
      if (newZoom == oldZoom) return true
      val ratio = newZoom / oldZoom
      scrollXPosition = (scrollXPosition + detector.focusX) * ratio - detector.focusX
      scrollYPosition = (scrollYPosition + detector.focusY) * ratio - detector.focusY
      zoom = newZoom
      clampScroll()
      invalidate()
      return true
    }

    override fun onScaleEnd(detector: ScaleGestureDetector) {
      zoom = ((zoom * 10f).toInt() / 10f).coerceIn(1f, 5f)
      clampScroll()
      invalidate()
    }
  })

  private val gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
    override fun onDown(event: MotionEvent): Boolean {
      if (!scroller.isFinished) scroller.abortAnimation()
      return true
    }

    override fun onScroll(first: MotionEvent?, current: MotionEvent, distanceX: Float, distanceY: Float): Boolean {
      scrollXPosition += distanceX
      scrollYPosition += distanceY
      clampScroll()
      invalidate()
      return true
    }

    override fun onDoubleTap(event: MotionEvent): Boolean {
      val oldZoom = zoom
      val newZoom = if (zoom > 1.15f) 1f else 2.5f
      val ratio = newZoom / oldZoom
      scrollXPosition = (scrollXPosition + event.x) * ratio - event.x
      scrollYPosition = (scrollYPosition + event.y) * ratio - event.y
      zoom = newZoom
      clampScroll()
      invalidate()
      return true
    }

    override fun onFling(first: MotionEvent?, current: MotionEvent, velocityX: Float, velocityY: Float): Boolean {
      scroller.fling(scrollXPosition.toInt(), scrollYPosition.toInt(), (-velocityX).toInt(), (-velocityY).toInt(), 0, maxScrollX().toInt(), 0, maxScrollY().toInt())
      postInvalidateOnAnimation()
      return true
    }
  })

  init {
    setBackgroundColor(Color.rgb(9, 11, 13))
    isFocusable = true
  }

  fun open(file: File, onLoad: (Int) -> Unit, onError: (Throwable) -> Unit) {
    val generation = ++loadGeneration
    sourceFile = file
    onLoaded = onLoad
    onFailed = onError
    rendererExecutor.execute {
      try {
        closeRenderer()
        val localDescriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
        val localRenderer = PdfRenderer(localDescriptor)
        val pageInfo = ArrayList<PageInfo>(localRenderer.pageCount)
        for (index in 0 until localRenderer.pageCount) {
          localRenderer.openPage(index).use { page -> pageInfo += PageInfo(page.width, page.height) }
        }
        if (pageInfo.isEmpty()) throw IllegalStateException("The protected PDF contains no pages.")
        descriptor = localDescriptor
        renderer = localRenderer
        mainHandler.post {
          if (disposed || generation != loadGeneration) return@post
          pages = pageInfo
          zoom = 1f
          scrollXPosition = 0f
          scrollYPosition = 0f
          updateBaseScale()
          onLoaded?.invoke(pageInfo.size)
          invalidate()
        }
      } catch (error: Throwable) {
        mainHandler.post { if (!disposed && generation == loadGeneration) onError(error) }
      }
    }
  }

  override fun onSizeChanged(width: Int, height: Int, oldWidth: Int, oldHeight: Int) {
    super.onSizeChanged(width, height, oldWidth, oldHeight)
    updateBaseScale()
    clampScroll()
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    scaleDetector.onTouchEvent(event)
    gestureDetector.onTouchEvent(event)
    if (event.actionMasked == MotionEvent.ACTION_UP || event.actionMasked == MotionEvent.ACTION_CANCEL) performClick()
    return true
  }

  override fun performClick(): Boolean {
    super.performClick()
    return true
  }

  override fun computeScroll() {
    if (scroller.computeScrollOffset()) {
      scrollXPosition = scroller.currX.toFloat()
      scrollYPosition = scroller.currY.toFloat()
      clampScroll()
      postInvalidateOnAnimation()
    }
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    if (pages.isEmpty() || width <= 0 || height <= 0) return

    val scaleBucket = (zoom * 100f).toInt().coerceIn(100, 500)
    activeScaleBucket = scaleBucket
    val renderScale = baseScale * scaleBucket / 100f
    val docWidth = documentWidth()
    var pageTop = documentMargin * zoom

    pages.forEachIndexed { pageIndex, page ->
      val pageWidth = page.width * renderScale
      val pageHeight = page.height * renderScale
      val pageLeft = (docWidth - pageWidth) / 2f
      val screenLeft = pageLeft - scrollXPosition
      val screenTop = pageTop - scrollYPosition
      val pageRect = RectF(screenLeft, screenTop, screenLeft + pageWidth, screenTop + pageHeight)

      if (pageRect.bottom >= 0f && pageRect.top <= height && pageRect.right >= 0f && pageRect.left <= width) {
        canvas.drawRect(pageRect, whitePaint)
        val visibleLeft = max(0, (-screenLeft).toInt())
        val visibleTop = max(0, (-screenTop).toInt())
        val visibleRight = min(ceil(pageWidth).toInt(), (width - screenLeft).toInt() + 1)
        val visibleBottom = min(ceil(pageHeight).toInt(), (height - screenTop).toInt() + 1)
        val firstTileX = visibleLeft / tileSize
        val lastTileX = max(firstTileX, max(visibleLeft, visibleRight - 1) / tileSize)
        val firstTileY = visibleTop / tileSize
        val lastTileY = max(firstTileY, max(visibleTop, visibleBottom - 1) / tileSize)

        for (tileY in firstTileY..lastTileY) {
          for (tileX in firstTileX..lastTileX) {
            val key = TileKey(pageIndex, scaleBucket, tileX, tileY)
            val bitmap = tileCache.get(key)
            val left = screenLeft + tileX * tileSize
            val top = screenTop + tileY * tileSize
            if (bitmap != null && !bitmap.isRecycled) canvas.drawBitmap(bitmap, left, top, paint)
            else requestTile(key, renderScale, ceil(pageWidth).toInt(), ceil(pageHeight).toInt())
          }
        }
      }
      pageTop += pageHeight + pageGap * zoom
    }
  }

  private fun requestTile(key: TileKey, renderScale: Float, renderedWidth: Int, renderedHeight: Int) {
    synchronized(pendingTiles) {
      if (tileCache.get(key) != null || !pendingTiles.add(key)) return
    }
    val generation = loadGeneration
    rendererExecutor.execute {
      try {
        if (disposed || generation != loadGeneration || key.scale != activeScaleBucket) return@execute
        val localRenderer = renderer ?: return@execute
        val left = key.x * tileSize
        val top = key.y * tileSize
        val tileWidth = min(tileSize, renderedWidth - left)
        val tileHeight = min(tileSize, renderedHeight - top)
        if (tileWidth <= 0 || tileHeight <= 0) return@execute
        val bitmap = Bitmap.createBitmap(tileWidth, tileHeight, Bitmap.Config.ARGB_8888)
        bitmap.eraseColor(Color.WHITE)
        localRenderer.openPage(key.page).use { page ->
          val matrix = Matrix().apply {
            setValues(floatArrayOf(renderScale, 0f, -left.toFloat(), 0f, renderScale, -top.toFloat(), 0f, 0f, 1f))
          }
          page.render(bitmap, null, matrix, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
        }
        if (disposed || generation != loadGeneration || key.scale != activeScaleBucket) bitmap.recycle()
        else {
          tileCache.put(key, bitmap)
          mainHandler.post { if (!disposed && generation == loadGeneration) invalidate() }
        }
      } catch (error: Throwable) {
        mainHandler.post { if (!disposed && generation == loadGeneration) onFailed?.invoke(error) }
      } finally {
        synchronized(pendingTiles) { pendingTiles.remove(key) }
      }
    }
  }

  private fun updateBaseScale() {
    if (width <= 0 || pages.isEmpty()) return
    baseScale = ((width - 2f * documentMargin) / pages.maxOf { it.width }.toFloat()).coerceAtLeast(0.1f)
  }

  private fun documentWidth(): Float {
    val pageWidth = (pages.maxOfOrNull { it.width } ?: 0) * baseScale * zoom
    return max(width.toFloat(), pageWidth + 2f * documentMargin * zoom)
  }

  private fun documentHeight(): Float {
    if (pages.isEmpty()) return 0f
    val pageHeights = pages.sumOf { it.height.toDouble() }.toFloat() * baseScale * zoom
    return pageHeights + (pages.size - 1) * pageGap * zoom + 2f * documentMargin * zoom
  }

  private fun maxScrollX(): Float = max(0f, documentWidth() - width)
  private fun maxScrollY(): Float = max(0f, documentHeight() - height)

  private fun clampScroll() {
    scrollXPosition = scrollXPosition.coerceIn(0f, maxScrollX())
    scrollYPosition = scrollYPosition.coerceIn(0f, maxScrollY())
  }

  private fun closeRenderer() {
    renderer?.close()
    descriptor?.close()
    renderer = null
    descriptor = null
  }

  fun destroy() {
    if (disposed) return
    disposed = true
    loadGeneration += 1
    rendererExecutor.execute { closeRenderer() }
    rendererExecutor.shutdown()
    mainHandler.removeCallbacksAndMessages(null)
    synchronized(pendingTiles) { pendingTiles.clear() }
    tileCache.evictAll()
    sourceFile?.delete()
    sourceFile = null
  }
}
