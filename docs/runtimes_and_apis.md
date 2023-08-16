# Daijishou JavaScript Runtimes and APIs

## Environments
Daijishou uses Javet library to enable JavaScript features. Javet provides [V8](https://v8.dev/#:~:text=V8%20is%20Google's%20open%20source,%2C%20ARM%2C%20or%20MIPS%20processors.) environment, it implements [ECMAScript](https://tc39.es/ecma262/) and WebAssembly. 

Therefore, Daijishou V8 Runtime, which is built upon those technologies, is a superset of V8 includes additional APIs and permission controls. Which means that, in general cases, Daijishou V8 Runtime inherits the ECMAScript language features.

Environment | JavaScript Technology | Abbreviation | Notes
-- | -- | -- | -- 
Daijishou Extension Manger V8 Runtime | [V8 by Javet](https://github.com/caoccao/Javet) | V8 | No permission control, less security. For debug purpose, can only be executed by user or Daijishou SDK. 
Daijishou Extension V8 Runtime | [V8 by Javet](https://github.com/caoccao/Javet) | Extension | -- 
WebView | WebView on Android | WebView | No API access, except basic communication with extension modules. 

## Permissions
Permission | Notes
-- | --
`all` | Very dangerous, please be responsible.
`debug` | Very dangerous, please be responsible.
`identification` | Get identification info of Daijishou.
`library` | Daijishou library that manage items and media.
`retro_achievements` | Daijishou Retro Achievements APIs.
`files` | Direct file access.
`internet` | APIs that related to internet.
`export_modules` | Expose and export V8 JavaScript modules.

## APIs
### Global Objects
Object | Type | isProxy | References | Required permissions | Environments | Notes
-- | -- | -- | -- | -- | -- | --
**Common** |  |  |  |  |  | 
`application` | Object | ✔️ | [Android Application](https://developer.android.com/reference/android/app/Application) | `all` | Extension & V8 | Daijishou Application Object. This object is for debug, and internal uses.
`daijishouUUID` | String | ❌ | -- | `identification` | Extension & V8 | Daijishou UUID of the device.
`lifecycleOwner` | Object | ✔️ | [Android lifecycle](https://developer.android.com/topic/libraries/architecture/lifecycle) | -- | Extension & V8 | Lifecycle object when [observation (LiveData)](https://developer.android.com/topic/libraries/architecture/livedata) is needed.
`lifecycleOwner.observeLiveData`| Function | ✔️ | [Android lifecycle](https://developer.android.com/topic/libraries/architecture/lifecycle), [Example](./examples/common.md#lifecycleownerobservelivedata) | -- | Extension & V8 | This is a function polyfill by Daijishou. 
**File** |  |  |  |  |  | 
`File` | Class | ✔️ | [Java File](https://docs.oracle.com/javase/8/docs/api/java/io/File.html) | `files` | Extension & V8 | --
`Files` | Object | ✔️ | [Java Files](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Files.html) | `files` | Extension & V8 | --
`Path` | Class | ✔️ | [Java Path](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Path.html) | `files` | Extension & V8 | --
`Paths` | Object | ✔️ | [Java Paths](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Paths.htmll) | `files` | Extension & V8 | --
**Database/Repository** |  |  |  |  |  | 
`daijishouLibraryRepository` | Object | ✔️ | [Documentation]() | `library` | Extension & V8 | --
`retroAchievementsRepository` | Object | ✔️ | [Documentation]() | `retro_achievements` | Extension & V8 | --
**Other** |  |  |  |  | | 
`Jsoup` | Object | ✔️ | [Jsoup](https://jsoup.org/) | `internet` | Extension & V8 | --
`dsess` | Object | ✔️ | [Documentation]() | `internet` | Extension & V8 | --
`scraper` | Object | ✔️ | [Documentation]() | `internet` | Extension & V8 | --
-- | -- | -- | -- | -- | -- | --