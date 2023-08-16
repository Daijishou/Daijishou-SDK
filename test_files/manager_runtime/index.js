// \fileop push ./test_files/manager_runtime daijishou-file://extension_manager
// \extensions js_file daijishou-file://extension_manager/index.js
// \fileop list daijishou-file://extension_manager/
import {test} from "./modules/module1.js"

// test("before")
// throw new Error("123")
// test(fs)
// test("after")
var a = 1
const platforms = application.daijishouLibraryRepository.getAllPlatformsStatically()
const platformNames = []
platforms.forEach(platform => {
    platformNames.push(platform.name);
})
console.log(platformNames);
console.log(lifecycle.currentState);

// export default 123

