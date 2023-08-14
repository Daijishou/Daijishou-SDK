// \fileop push ./test_files/manager_runtime daijishou-file://extension_manager
// \extensions js_file daijishou-file://extension_manager/index.js
import {test} from "./modules/module1.js"

throw new Error("123");
test(fs);
test(12345);