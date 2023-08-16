# Daijishou JavaScript Runtimes and APIs

## Environments
Environment | JavaScript Technology | Abbreviation | Notes
-- | -- | -- | -- 
Daijishou Extension Manger V8 Runtime | [V8 by Javet](https://github.com/caoccao/Javet) | V8 | No permission control, less security. For debug purpose, can only be executed by user or Daijishou SDK. 
Daijishou Extension V8 Runtime | [V8 by Javet](https://github.com/caoccao/Javet) | Extension | -- 
WebView | WebView on Android | WebView | No API access, except basic communication with extension modules. 

## Permissions
Permission | Notes
-- | --
`all` | Very dangerous, please be responsible.
`library` | Daijishou library that manage items and media.
`files` | Direct file access.
`internet` | APIs that related to internet.
`export_modules` | Expose and export V8 JavaScript modules.

## APIs
<!-- ### Common Objects -->
Object | Is JVM proxy | Reference | Required permission | Environment | Notes
-- | -- | -- | -- | -- | --
Common |  |  |  |  | 
`application` | true | [Android Application](https://developer.android.com/reference/android/app/Application) | `all` | Extension & V8 | Daijishou Application Object. This object is for debug, and internal uses.
`lifecycle` | true | [Android lifecycle](https://developer.android.com/reference/androidx/lifecycle/package-summary) | -- | Extension & V8 | Lifecycle object when [observation (LiveData)](https://developer.android.com/topic/libraries/architecture/livedata) is needed.
Files |  |  |  |  | 
`File` | true | [Java File](https://docs.oracle.com/javase/8/docs/api/java/io/File.html) | `files` | Extension & V8 | --
`Files` | true | [Java Files](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Files.html) | `files` | Extension & V8 | --
`Path` | true | [Java Path](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Path.html) | `files` | Extension & V8 | --
`Paths` | true | [Java Paths](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Paths.htmll) | `files` | Extension & V8 | --
-- | -- | -- | -- | -- | --