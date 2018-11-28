/**
 * 初期表示 ダウンロード処理
 */
function init(request) {
    // formaスクリプトをpublicStorageより取得しformaDataArrayに設定
    var formaDataArray = this.getFormaScripts();
    // 0件の場合、処理終了
    if (formaDataArray.length == 0) {
        return;
    }
    // formaスクリプトworkディレクトリ作成
    var dirPath = "formaScriptTool/" + Identifier.get() + "/";
    var tmpDirStorage = new PublicStorage(dirPath);
    tmpDirStorage.makeDirectories();
    // workディレクトリにformaスクリプトファイル出力
    this.saveScritpFiles(dirPath, formaDataArray);
    // workディレクトリごと圧縮してzipファイル作成
    var zipResult = Archiver.zip({
        "src" : tmpDirStorage
    });
    // formaスクリプトworkディレクトリ削除
    tmpDirStorage.remove(true);
    // zipファイルダウンロード
    Module.download.send(zipResult, "formaスクリプト.zip");
}


/**
 * Formaスクリプトとそのアプリ名、フォーム名をformaDataArrayに設定
 */
function getFormaScripts() {
    var formaDataArray = [];
    // publicストレージのformaディレクトリ以下すべてのjsonファイル列挙
    new PublicStorage("forma").filesStorages(true).forEach(function(storage) {
        if (storage.getName().indexOf(".json") != -1) {
            var formId = storage.getName().slice(0, -5);
            // formaアプリケーション情報をDBより取得し、グローバル変数へ設定
            var formaInfo = this.getFormaInfo(formId);
            storage.openAsText(function(reader, error) {
                if (error != null) {
                    Debug.print('ファイルのオープン中にエラーが起きました' + error.message);
                    throw error;
                }
                
                // 一行のみのファイルなのでこれだけで問題なし
                var jsonString = reader.readLine();
                if (ImJson.checkJSONString(jsonString)) {
                    var formaObject = ImJson.parseJSON(jsonString);
                    // アクション処理カスタムスクリプト customScript
                    formaJsonAnalysisCustomScript(formaObject, formaDataArray, formaInfo);
                    // 画面アイテムスクリプト script
                    formaJsonAnalysisRecursively(formaObject, formaDataArray, formaInfo);
                    formaObject = null;
                }
                
            }, 'UTF-8');
        }
    });
    return formaDataArray;
}

/**
 * formaのJsonオブジェクト内のアクション処理カスタムスクリプト解析
 */
function formaJsonAnalysisCustomScript(formaObject, formaDataArray, formaInfo) {
    if (typeof formaObject.event == 'undefined') {
        return;
    }
    // 初期表示イベント
    this.loadEventCustomScript(formaObject, formaDataArray, formaInfo);
    // アイテムイベント
    this.itemEventCustomScript(formaObject, formaDataArray, formaInfo);
    // 明細テーブルイベント
    this.tableEventCustomScript(formaObject, formaDataArray, formaInfo);
}

/**
 * アクション処理 テーブルイベント カスタムスクリプト解析
 */
function tableEventCustomScript(formaObject, formaDataArray, formaInfo) {
    if (typeof formaObject.event.table_action_setting_list == 'undefined') {
        return;
    }
    var tableEvents = formaObject.event.table_action_setting_list;
    for ( var tableItemid in tableEvents) {
        var tableEvents = tableEvents[tableItemid];
        // key名がitemId itemIdで名称検索してセット
        var tableItemObject = formaObject.item_list.filter(function(item) {
            return item.item_id == tableItemid;
        });
        for ( var column in tableEvents) {
            var tableColmunEvents = tableEvents[column];
            for ( var row in tableColmunEvents) {
                var tableItemEvents = tableColmunEvents[row];
                for ( var eventType in tableItemEvents) {
                    tableItemEvents[eventType].forEach(function(event) {
                        if (event.actionType == "customScript") {
                            var itemName = "テーブルイベント_";
                            if (isArray(tableItemObject) && (tableItemObject.length > 0)) {
                                itemName += tableItemObject[0].item_view_names.ja.trim() + "_";
                            }
                            itemName += column + "_" + eventType;
                            formaDataArray.push({
                                "appId" : formaInfo.appId,
                                "appName" : formaInfo.appName,
                                "formId" : formaInfo.formId,
                                "formName" : formaInfo.formName,
                                "itemName" : itemName,
                                "script" : event.customScript
                            });
                        }
                    });
                }
            }
        }
    }
    
}
/**
 * アクション処理 アイテムイベント カスタムスクリプト解析
 */
function itemEventCustomScript(formaObject, formaDataArray, formaInfo) {
    if (typeof formaObject.event.action_setting_list == 'undefined') {
        return;
    }
    var itemEvents = formaObject.event.action_setting_list;
    for ( var itemid in itemEvents) {
        var events = itemEvents[itemid];
        // key名がitemId itemIdで名称検索してセット
        var itemObject = formaObject.item_list.filter(function(item) {
            return item.item_id == itemid;
        });
        
        for ( var eventType in events) {
            events[eventType].forEach(function(event) {
                if (event.actionType == "customScript") {
                    var itemName = "アイテムイベント_";
                    if (isArray(itemObject) && (itemObject.length > 0)) {
                        itemName += itemObject[0].item_view_names.ja.trim() + "_";
                        if (isArray(itemObject[0].input_list) && (itemObject[0].input_list.length > 0)) {
                            itemName += itemObject[0].input_list[0].input_id + "_";
                        }
                    }
                    itemName += eventType;
                    formaDataArray.push({
                        "appId" : formaInfo.appId,
                        "appName" : formaInfo.appName,
                        "formId" : formaInfo.formId,
                        "formName" : formaInfo.formName,
                        "itemName" : itemName,
                        "script" : event.customScript
                    });
                }
            });
        }
    }
    
}

/**
 * アクション処理 初期表示イベント カスタムスクリプト解析
 */
function loadEventCustomScript(formaObject, formaDataArray, formaInfo) {
    if (typeof formaObject.event.form_action_setting_list == 'undefined') {
        return;
    }
    for ( var key in formaObject.event.form_action_setting_list) {
        var loadEvents = formaObject.event.form_action_setting_list[key].load;
        loadEvents.forEach(function(event) {
            if (event.actionType == "customScript") {
                var itemName = "初期表示イベント_カスタムスクリプト";
                formaDataArray.push({
                    "appId" : formaInfo.appId,
                    "appName" : formaInfo.appName,
                    "formId" : formaInfo.formId,
                    "formName" : formaInfo.formName,
                    "itemName" : itemName,
                    "script" : event.customScript
                });
            }
        });
    }
}

/**
 * formaのJsonオブジェクトを再帰処理で解析（画面アイテムスクリプト解析）
 */
function formaJsonAnalysisRecursively(formaObject, formaDataArray, formaInfo) {
    for ( var key in formaObject) {
        if (typeof formaObject[key] == "object") {
            if (isArray(formaObject[key])) {
                // 配列の場合はで要素ごとにに再帰呼び出し
                formaObject[key].forEach(function(item) {
                    this.formaJsonAnalysisRecursively(item, formaDataArray, formaInfo);
                });
            } else {
                if (key == "item_view_names") {
                    formaInfo.itemName = formaObject[key].ja.trim();
                }
                // 連想配列はそのまま再帰呼び出し
                this.formaJsonAnalysisRecursively(formaObject[key], formaDataArray, formaInfo);
            }
        } else {
            // 配列や連想配列でなければキーの値を表示
            // script項目を検索する
            // script項目を保持している場所のラベル名とかを取る
            if ((key == "script") && (formaObject[key] != "")) {
                formaDataArray.push({
                    "appId" : formaInfo.appId,
                    "appName" : formaInfo.appName,
                    "formId" : formaInfo.formId,
                    "formName" : formaInfo.formName,
                    "itemName" : formaInfo.itemName,
                    "script" : formaObject[key]
                });
            }
        }
    }
}

/**
 * DBよりformaのアプリ名、アプリID、フォーム名を取得する
 */
function getFormaInfo(formId) {
    var formaInfo = {
        "formId" : formId,
        "formName" : "",
        "appName" : "",
        "appId" : ""
    };
    var db = new TenantDatabase();
    var params = {
        "form_id" : DbParameter.string(formId)
    };
    var result = db.executeByTemplate("tool/getFormaInfo", params); // getFormaInfo.sqlのパスに合わせて修正
    if (!result.error && result.countRow != 0) {
        formaInfo.appId = result.data[0].application_id;
        formaInfo.appName = result.data[0].application_name.trim();
        formaInfo.formName = result.data[0].form_name.trim();
    }
    return formaInfo;
}

/**
 * formaスクリプトworkディレクトリにスクリプトファイル出力
 */
function saveScritpFiles(dirPath, formaDataArray) {
    var i = 1;
    var appDirPath = "";
    var beforeAppDirPath = "";
    var formDirPath = "";
    var beforeFormDirPath = "";
    
    formaDataArray.forEach(function(row) {
        appDirPath = dirPath + row.appId + "_" + row.appName + "/";
        if (appDirPath != beforeAppDirPath) {
            var appDirStorage = new PublicStorage(appDirPath);
            appDirStorage.makeDirectories();
        }
        formDirPath = appDirPath + row.formId + "_" + row.formName + "/";
        if (formDirPath != beforeFormDirPath) {
            var formDirStorage = new PublicStorage(formDirPath);
            formDirStorage.makeDirectories();
            i = 1; // ファイル名に連番を振って重複防止
        }
        beforeAppDirPath = appDirPath;
        beforeFormDirPath = formDirPath;
        var fileName = i.toString() + "_" + row.itemName + ".js";
        i++;
        var scriptFileStorage = new PublicStorage(formDirPath + "/" + fileName);
        scriptFileStorage.createAsText(function(writer, error) {
            if (error != null) {
                Debug.print('ファイルのオープン中にエラーが起きました' + error.message);
                throw error;
            }
            var writeValue = "/*\n";
            writeValue += " アプリケーションID： " + row.appId + "\n";
            writeValue += " アプリケーション名： " + row.appName + "\n";
            writeValue += " フォームID　　　　： " + row.formId + "\n";
            writeValue += " フォーム名　　　　： " + row.formName + "\n";
            writeValue += " アイテム名　　　　： " + row.itemName + "\n";
            writeValue += "*/\n\n";
            writeValue += row.script;
            writer.write(writeValue);
        }, 'UTF-8');
    });
}
