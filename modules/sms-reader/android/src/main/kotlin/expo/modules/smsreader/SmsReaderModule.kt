// package expo.modules.smsreader

// import android.database.Cursor
// import android.net.Uri
// import expo.modules.kotlin.modules.Module
// import expo.modules.kotlin.modules.ModuleDefinition
// import expo.modules.kotlin.Promise

// class SmsReaderModule : Module() {
//   override fun definition() = ModuleDefinition {
//     Name("SmsReader")

//     // bulk read — called once on onboarding
//     AsyncFunction("readSMS") { minDate: Double, maxCount: Int, promise: Promise ->
//       try {
//         val uri = Uri.parse("content://sms/inbox")
//         val projection = arrayOf("address", "body", "date")
//         val selection = "date >= ?"
//         val selectionArgs = arrayOf(minDate.toLong().toString())
//         val sortOrder = "date DESC LIMIT $maxCount"

//         val cursor: Cursor? = appContext.reactContext?.contentResolver?.query(
//           uri, projection, selection, selectionArgs, sortOrder
//         )

//         val results = mutableListOf<Map<String, Any>>()
//         cursor?.use {
//           while (it.moveToNext()) {
//             results.add(mapOf(  
//               "address" to (it.getString(0) ?: ""),
//               "body"    to (it.getString(1) ?: ""),
//               "date"    to it.getLong(2).toDouble()
//             ))
//           }
//         }
//         promise.resolve(results)
//       } catch (e: Exception) {
//         promise.reject("SMS_READ_ERROR", e.message, e)
//       }
//     }
//   }
// }