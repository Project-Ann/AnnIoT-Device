const fs       = require('fs');
const homedir  = require('os').homedir();

/**
 * Read userdata
 * @return {Object} Data -Get user data
 */
function dataRead() {
    return JSON.parse(
        fs.readFileSync(
            homedir + "/iotConfig.data","utf8"
        )
    )
}

/**
 * Write user data
 * @param {Object} obj Data object
 * @returns {void} 
 */
function dataWrite(obj) {
    fs.writeFileSync(
        homedir + "/iotConfig.data",
        JSON.stringify(
            obj,null,2
        )
    );
}

/**
 * Check data is available
 * @returns {boolean} Get File exist or not
 */
function dataCheck() {
    return JSON.parse(
        fs.existsSync(
            homedir + "/iotConfig.data"
        )
    )
}

/**
 * Delete user data
 * @returns {void}
 */
function dataDelete() {
    fs.unlinkSync(
        homedir + "/iotConfig.data"
    );
}

module.exports = {
    read :  dataRead,
    write:  dataWrite,
    check:  dataCheck,
    delete: dataDelete
}