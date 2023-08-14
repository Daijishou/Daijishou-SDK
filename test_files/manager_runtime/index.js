// \fileop push ./test_files/manager_runtime daijishou-file://extension_manager
// \extensions js_file daijishou-file://extension_manager/index.js
// \fileop list daijishou-file://extension_manager/
import {test} from "./modules/module1.js"

test("before")
// throw new Error("123")
// test(fs)
test("after")

// export default 123