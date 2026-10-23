package expo.modules.jetpackpdfviewer

import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

internal fun supportsJetpackPdfViewer(): Boolean = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P

class ExpoJetpackPdfViewerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoJetpackPdfViewer")

    Constant("isSupported") { supportsJetpackPdfViewer() }

    View(ExpoJetpackPdfViewerView::class) {
      Events("onLoad", "onError")

      Prop("uri") { view: ExpoJetpackPdfViewerView, uri: String? ->
        view.setUri(uri)
      }

      Prop("headers") { view: ExpoJetpackPdfViewerView, headers: Map<String, Any?>? ->
        view.setHeaders(headers)
      }

      OnViewDidUpdateProps { view ->
        view.loadRequestedDocument()
      }

      OnViewDestroys { view ->
        view.destroy()
      }
    }
  }
}
