package expo.modules.emergencycontactmodule

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import android.content.Intent
import android.net.Uri
import android.app.Activity
import android.content.Context
import android.telephony.SmsManager
import android.os.Build

class EmergencyContactModule : Module() {
  private val currentActivity: Activity?
    get() = appContext.currentActivity
  
  private fun getSmsManager(context: Context): SmsManager {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      context.getSystemService(SmsManager::class.java)
    } else {
      @Suppress("DEPRECATION")
      SmsManager.getDefault()
    }
  }

  override fun definition() = ModuleDefinition {
    Name("EmergencyContactModule")

    AsyncFunction("makePhoneCall") { phoneNumber: String, promise: Promise ->
      val activity = currentActivity ?: run {
        return@AsyncFunction
      }

      try {
        val callIntent = Intent(Intent.ACTION_CALL).apply {
          data = Uri.parse("tel:$phoneNumber")
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }

        activity.startActivity(callIntent)
        promise.resolve("CALL_SUCCESS")
      } catch (e: Exception) {
        promise.reject(
          "CALL_FAILED",
          "Failed to make phone call: ${e.message}",
          e
        )
      }
    }

    AsyncFunction("sendSms") { phoneNumber: String, message: String, promise: Promise ->
      try {
        val smsManager = getSmsManager(appContext.reactContext ?: throw Exception("React context is null"))

        if (message.length > 160) {
          val parts = smsManager.divideMessage(message)
          smsManager.sendMultipartTextMessage(
            phoneNumber,
            null,
            parts,
            null,
            null
          )
        } else {
          smsManager.sendTextMessage(
            phoneNumber,
            null,
            message,
            null,
            null
          )
        }

        promise.resolve("SMS_SUCCESS")
      } catch (e: Exception) {
        promise.reject("500", "Failed to send SMS: ${e.message}", e)
      }
    }
  }
}