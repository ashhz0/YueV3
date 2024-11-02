/*!
 * YueV3
 * Copyright (c) 2024 Rui Reogo
 * ISC Licensed
 */
 
/**
 * Dependencies.
 */

const promisify = require("node:promisify");
const debug     = require("debug")("yue:main");
const { exec }  = require("child_process");
const fs        = require("fs-extra");
const login     = promisify(require("./bot/login"));
const path      = require("path");

/**
 * Setup.
 */

global.YueV3 = {
    startTime: new Date(),
    
    paths: {
        config: path.join(__dirname, "config.json"),
        commandsPath: path.join(__dirname, "bot", "commands"),
        eventsPath: path.join(__dirname, "bot", "events"),
        statePath: path.join(__dirname, "appstate.json")
    },
    
    get config() {
        return fs.readJSONSync(this.paths.config);
    },
    
    commandPrefix: this.config.commandPrefix,
    botCommands: {},
    botEvents: {},
};

/**
 * Events and commands loader.
 */

const loadCommands = async function() {
    const commandFiles = fs
        .readdirSync(global.YueV3.paths.commandsPath)
        .filter((file) => file.endsWith(".js"));

    commandFiles.forEach((file) => {
        try {
            const commandName   = path.basename(file, ".js");
            const startTime     = new Date();
            const commandModule = require(path.join(
                global.YueV3.paths.commandsPath, file
            ));
            const endTime       = new Date();

            global.YueV3.botCommands[commandName] = commandModule;
            
            debug(`Loaded ${commandName} - (${Math.abs(startTime - endTime)}`);
        } catch (err) {
            if (err.code === "MODULE_NOT_FOUND") {
                const missingModule = err.message.split("'")[1];
                exec(`npm i ${missingModule}`, function(err) {
                   if (!err) {
                       const commandName   = path.basename(file, ".js");
                       const startTime     = new Date();
                       const commandModule = require(path.join(
                           global.YueV3.paths.commandsPath, file
                       ));
                       const endTime       = new Date();
                       
                       global.YueV3.botCommands[commandName] = commandModule;
                       
                       debug(`Loaded ${commandName} - (${Math.abs(startTime - endTime)}`);
                   };
                });
            };
        };
    });
};

const loadEvents = async function() {
    const eventFiles = fs
        .readdirSync(global.YueV3.paths.eventsPath)
        .filter((file) => file.endsWith(".js"));

    eventFiles.forEach((file) => {
        try {
            const eventName   = path.basename(file, ".js");
            const startTime   = new Date();
            const eventModule = require(path.join(
                global.YueV3.paths.eventsPath, file
            ));
            const endTime     = new Date();

            global.YueV3.botCommands[commandName] = commandModule;
            
            debug(`Loaded ${eventName} - (${Math.abs(startTime - endTime)}`);
        } catch (err) {
            if (err.code === "MODULE_NOT_FOUND") {
                const missingModule = err.message.split("'")[1];
                exec(`npm i ${missingModule}`, function(err) {
                   if (!err) {
                       const commandName   = path.basename(file, ".js");
                       const startTime     = new Date();
                       const commandModule = require(path.join(
                           global.paths.commandsPath, file
                       ));
                       const endTime       = new Date();
                       
                       global.YueV3.botCommands[commandName] = commandModule;
                       
                       debug(`Loaded ${eventName} - (${Math.abs(startTime - endTime)}`);
                   };
                });
            };
        };
    });
};


function handleBotEvents(api, event) {
  const react = (emoji) => {
    api.setMessageReaction(emoji, event.messageID, () => {}, true);
  };
  const reply = (msg) => {
    api.sendMessage(msg, event.threadID, event.messageID);
  };
  const add = (uid) => {
    api.addUserToGroup(uid, event.threadID);
  };
  const kick = (uid) => {
    api.removeUserFromGroup(uid, event.threadID);
  };
  const send = (msg) => {
    api.sendMessage(msg, event.threadID);
  };

  const box = {
    react: react,
    reply: reply,
    add: add,
    kick: kick,
    send: send,
  };

  try {
    if (event.body && event.body.toLowerCase() === "prefix") {
      api.sendMessage(
        `My prefix is: \`${commandPrefix}\``,
        event.threadID,
        event.messageID,
      );
    } else if (
      event.body &&
      event.body.toLowerCase().startsWith(commandPrefix)
    ) {
      const [command, ...args] = event.body
        .slice(commandPrefix.length)
        .trim()
        .split(" ");

      if (botCommands[command]) {
        botCommands[command].run({ api, event, args, box });
      } else {
        box.reply("Command doesnt exist.")
      }
    }
  } catch (error) {
    debug(`Error occured while executing command. ${error}`);
  }
}

const main = async function() {
    console.log("YueV3 :>");
    console.log("Forked by @ashhz0");
    console.log("Made by @ruingl");
    
    await loadCommands();
    await loadEvents();
    
    const appState = await fs.readJSON(global.YueV3.paths.statePath);
    const api = await login({ appState });
    
    if (!api) {
        debug(`ERR! Cant login.`);
        process.exit();
    } else {
        api.listenMqtt((err, event) => {
            if (!err) return;
            
            handleBotEvents(api, event);
        });
    };
};

main();