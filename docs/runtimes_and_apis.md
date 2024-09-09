# Daijishou JavaScript Runtimes and APIs

## Environments
Daijishou uses [Javet library](https://github.com/caoccao/Javet) to enable JavaScript features. Javet provides [Node.js V8](https://nodejs.org/en/learn/getting-started/the-v8-javascript-engine) environment, it implements [ECMAScript](https://tc39.es/ecma262/) and WebAssembly. 

Therefore, Daijishou Node.js V8 Runtime, which is built upon those technologies, is a superset of Node.js V8 includes additional APIs and permission controls. Which means that, in general cases, Daijishou V8 Runtime inherits the ECMAScript language features.

Environment | JavaScript Technology | Abbreviation | Notes
-- | -- | -- | -- 
Daijishou Extension Manger V8 Runtime | [V8 by Javet](https://github.com/caoccao/Javet) |  Node.js V8 | No permission control, less security. For debug purpose, can only be executed by user or Daijishou SDK. 
Daijishou Extension V8 Runtime | [V8 by Javet](https://github.com/caoccao/Javet) | Extension | -- 
WebView | WebView on Android | WebView | No API access, except basic communication with extension modules. 

## Permissions
Permission | Notes
-- | --
`all` | This wil enable every permissions. Very dangerous, please be responsible.
`debug` | Enable debug features. Very dangerous, please be responsible.
`system` | Allow the extension to get system and identification info of Daijishou.
`library` | Allow access to Daijishou library that manage items and media.
`retro_achievements` | Enable daijishou Retro Achievements APIs.
`files` | Enable direct file access.
`internet` | Enable APIs that related to internet.
`interactions` | Enable ability to toast messages and show dialogs.
`export_modules` | Allow the extension to expose and export V8 JavaScript modules.

## APIs
### Global Objects
Object | Type | isProxy | References | Required permissions | Notes
-- | -- | -- | -- | -- | --
**Common (Extension & V8)** |  |  |  |  |  | 
`locale` | String | ❌ | -- | -- | For example `en-US`, `zh-TW`.
`lifecycleOwner` | Object | ✔️ | [Android lifecycle](https://developer.android.com/topic/libraries/architecture/lifecycle) | -- | --
`lifecycleOwner.observeLiveData`| Function | ✔️ | [Android lifecycle](https://developer.android.com/topic/libraries/architecture/lifecycle), [Detail](./apis_details.md#lifecycleownerobservelivedata) | -- | This is a function when [observation of LiveData](https://developer.android.com/topic/libraries/architecture/livedata) is needed.
`daijishouUriHandler`| Object | ✔️ | [Android lifecycle](https://developer.android.com/topic/libraries/architecture/lifecycle) | -- | See document for more details.
`localStorage`| Object | ✔️ | [W3School](https://www.w3schools.com/jsref/prop_win_localstorage.asp), [HTML Standard](https://html.spec.whatwg.org/multipage/webstorage.html#the-localstorage-attribute) | -- | Simple solution for storing data. Html `localStorage` object implemented by Daijishou.
`createSQLiteOpenHelper`| Function | ✔️ | [Android SQLite3](https://developer.android.com/training/data-storage/sqlite), [Android SQLiteOpenHelper](https://developer.android.com/reference/android/database/sqlite/SQLiteOpenHelper), [Detail]() | -- | Complicated yet more thorough solution for storing data.
`getJavaClassMethods`| Function | ❌ | -- | `debug` | Get Java object's class methods in string list.
`getJavaClassFields`| Function | ❌ | -- | `debug` | Get Java object's class fields in string list.
**File (Extension & V8)** |  |  |  |  |  | 
`installedDirectory`| String | ❌ | -- | `files` | Get directory path where the extension is installed.
`dataDirectory`| String | ❌ | -- | `files` | Directory path for Javascript Runtime to store data.
`cacheDirectory`| String | ❌ | -- | `files` | Directory path for Javascript Runtime to store cache files. Those files can be cleaned by Daijishou when necessary.
`tempDirectory`| String | ❌ | -- | `files` | Directory path for temporary files. Cleaned up on every startup. Unlike cache directory, this for one time use scenario.
`File` | Class | ✔️ | [Java File](https://docs.oracle.com/javase/8/docs/api/java/io/File.html) | `files` | --
`Files` | Object | ✔️ | [Java Files](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Files.html) | `files` | --
`Path` | Class | ✔️ | [Java Path](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Path.html) | `files` | --
`Paths` | Object | ✔️ | [Java Paths](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Paths.htmll) | `files` | --
**Database (Extension & V8)** |  |  |  |  |  | 
`daijishouLibraryRepository` | Object | ✔️ | [Documentation]() | `library` | See document for more details.
`retroAchievementsRepository` | Object | ✔️ | [Documentation]() | `retro_achievements` | See document for more details.
`syncLibrary` | Function | ✔️ | -- | `library` | Sync and backup library.
`backupLibrary` | Function | ✔️ | -- | `library` | Only backup library.
**Internet  (Extension & V8)** |  |  |  |  |  | 
`URI` | Class | ✔️ | [Java URI](https://docs.oracle.com/javase/8/docs/api/java/net/URI.html) | `internet` | --
`URL` | Class | ✔️ | [Java URL](https://docs.oracle.com/javase/8/docs/api/java/net/URL.html), [Java Http Request](https://www.baeldung.com/java-http-request) | `internet` | --
`URLConnection` | Class | ✔️ | [Java URLConnection](https://docs.oracle.com/javase/8/docs/api/java/net/URLConnection.html) | `internet` | --
`HttpURLConnection` | Class | ✔️ | [Java HttpURLConnection](https://docs.oracle.com/javase/8/docs/api/java/net/HttpURLConnection.html) | `internet` | --
`jsoup` | Object | ✔️ | [Jsoup](https://jsoup.org/) | `internet` | --
`dsess` | Object | ✔️ | [Detail](), [Syntax](https://github.com/TapiocaFox/Daijishou/blob/main/docs/dsess.md) | `internet` | --
`scraper` | Object | ✔️ | [Detail]() | `internet` | --
**Interaction  (Extension & V8)** |  |  |  |  |  | 
`toast` | Function | ✔️ | [Detail](./apis_details.md#toast) | `interactions` | --
`showPlayableItemChooserDialog` | Function | ✔️ | [Detail](./apis_details.md#showplayableitemchooserdialog) | `interactions` | Pop up a dialog to ask for a playableItem.
`showAcknowledgementDialog` | Function | ✔️ | [Detail](./apis_details.md#showacknowledgementdialog) | `interactions` | Pop up a yes-or-no dialog. With message.
`showRetroAchievementsGameDialogByGameId` | Function | ✔️ | [Detail](./apis_details.md#showretroachievementsgamedialogbygameid) | `interactions` | Pop up a [RetroAchievements](https://retroachievements.org) dialog by gamd id.
**Daijishou  (Extension & V8)** |  |  |  |  |  | 
`application` | Object | ✔️ | [Android application](https://developer.android.com/reference/android/app/Application) | `all` | Daijishou Application Object. This object is for debug, and internal uses.
`daijishouUUID` | String | ❌ | -- | `system` | Daijishou UUID of the device.
`getDaijishouUptime` | Function | ❌ | -- | `system` | Daijishou UUID of the device.
`daijishouVersionCode` | Int | ❌ | -- | -- | Daijishou's version.
`daijishouVersionName` | String | ❌ | -- | -- | Daijishou's version.
**Me (Only Extension)** |  |  |  |  |  | 
`me.id` | String | ❌ | -- | -- | -- | --
`me.name` | String | ❌ | -- | -- | -- | --
`me.description` | String | ❌ | -- | -- | -- | --
`me.authors` | String | ❌ | -- | -- | -- | --
`me.version` | String | ❌ | -- | -- | -- | --
`me.apiLevel` | String | ❌ | -- | -- | -- | --
`me.permissions` | String List | ❌ | -- | -- | -- | --
`me.getUptime` | Function | ✔️ | -- | -- | -- | --
**Implementation  (Only Extension)** |  |  |  |  |  | 
`proposeImplementation` | Function | ✔️ | -- | -- | -- | --
`ScraperImplementation` | Class | ✔️ | -- | ? | -- | --
`LibraryWebViewImplementation` | Class | ✔️ | -- | ? | -- | --
**Extension's Resource (Only Extension)** |  |  |  |  |  | 
`getString` | Function | ✔️ | -- | -- | Localisation. 
**Other (Only Extension)** |  |  |  |  |  | 
-- | -- | -- | -- | -- | -- 
