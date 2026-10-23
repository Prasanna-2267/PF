package expo.modules.jetpackpdfviewer

import android.content.Context
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.view.View
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import java.util.concurrent.Executors

class ExpoJetpackPdfViewerView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext) {
  private val onLoad by EventDispatcher()
  private val onError by EventDispatcher()
  private val mainHandler = Handler(Looper.getMainLooper())
  private val downloadExecutor = Executors.newSingleThreadExecutor()

  private var requestedUri: String? = null
  private var requestedHeaders: Map<String, String> = emptyMap()
  private var activeRequestKey: String? = null
  private var requestGeneration = 0
  private var cachedFile: File? = null
  private var pdfView: ZoomAwarePdfView? = null
  private var destroyed = false

  init {
    id = View.generateViewId()
    setBackgroundColor(Color.rgb(9, 11, 13))
  }

  fun setUri(uri: String?) {
    requestedUri = uri?.trim()?.takeIf { it.isNotEmpty() }
  }

  fun setHeaders(headers: Map<String, Any?>?) {
    requestedHeaders = headers
      ?.mapNotNull { (key, value) -> (value as? String)?.let { key to it } }
      ?.toMap()
      ?: emptyMap()
  }

  fun loadRequestedDocument() {
    if (destroyed) return
    val uri = requestedUri ?: return
    val requestKey = buildString {
      append(uri)
      requestedHeaders.toSortedMap().forEach { (key, value) -> append('\n').append(key).append(':').append(value) }
    }
    if (requestKey == activeRequestKey) return

    activeRequestKey = requestKey
    val generation = ++requestGeneration
    val headers = requestedHeaders.toMap()

    downloadExecutor.execute {
      try {
        val file = downloadProtectedPdf(uri, headers)
        mainHandler.post {
          if (destroyed || generation != requestGeneration) {
            file.delete()
            return@post
          }
          attachDocument(file, generation)
        }
      } catch (error: Throwable) {
        mainHandler.post {
          if (!destroyed && generation == requestGeneration) {
            activeRequestKey = null
            emitError(error)
          }
        }
      }
    }
  }

  private fun downloadProtectedPdf(uri: String, headers: Map<String, String>): File {
    val cacheDirectory = File(context.cacheDir, "protected-pdfs").apply { mkdirs() }
    val outputFile = File(cacheDirectory, UUID.randomUUID().toString() + ".pdf")
    val connection = (URL(uri).openConnection() as HttpURLConnection).apply {
      connectTimeout = 20_000
      readTimeout = 60_000
      instanceFollowRedirects = true
      requestMethod = "GET"
      useCaches = false
      headers.forEach { (name, value) -> setRequestProperty(name, value) }
    }

    try {
      val responseCode = connection.responseCode
      if (responseCode !in 200..299) {
        connection.errorStream?.close()
        throw IllegalStateException("The protected PDF request returned HTTP $responseCode.")
      }
      connection.inputStream.use { input ->
        FileOutputStream(outputFile).use { output -> input.copyTo(output) }
      }
      if (outputFile.length() == 0L) throw IllegalStateException("The protected PDF response was empty.")
      return outputFile
    } catch (error: Throwable) {
      outputFile.delete()
      throw error
    } finally {
      connection.disconnect()
    }
  }

  private fun attachDocument(file: File, generation: Int) {
    removeViewerAndCachedFile()
    cachedFile = file
    val viewer = ZoomAwarePdfView(context)
    pdfView = viewer
    addView(viewer, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    viewer.open(
      file,
      onLoad = { pages ->
        if (!destroyed && generation == requestGeneration) onLoad(mapOf("pages" to pages))
      },
      onError = { error ->
        if (!destroyed && generation == requestGeneration) {
          activeRequestKey = null
          emitError(error)
        }
      },
    )
  }

  private fun emitError(error: Throwable) {
    val message = error.message?.takeIf { it.isNotBlank() } ?: "The protected PDF could not be opened."
    onError(mapOf("message" to message))
  }

  private fun removeViewerAndCachedFile() {
    pdfView?.destroy()
    pdfView?.let { removeView(it) }
    pdfView = null
    cachedFile?.delete()
    cachedFile = null
  }

  fun destroy() {
    if (destroyed) return
    destroyed = true
    requestGeneration += 1
    removeViewerAndCachedFile()
    downloadExecutor.shutdownNow()
    mainHandler.removeCallbacksAndMessages(null)
  }
}
