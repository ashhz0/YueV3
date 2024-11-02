/*!
 * YueV3
 * Copyright (c) 2024 Rui Reogo
 * ISC Licensed
 */

process.env.DEBUG = "yue:*";
console.clear();

const { spawn } = require("child_process");

const start = function() {
    const child = spawn('node yue.js', {
        cwd: __dirname,
        stdio: 'inherit',
        env: process.env,
        shell: true,
    });
    
    child.on("close", function(c) {
        if (c === 2) start();
    });
};

start();