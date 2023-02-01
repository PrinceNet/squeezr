#!/usr/bin/env node
const squeezr = require("./src/squeezr.cjs");

const CWD = process.cwd();
const ARGV = require("minimist")(process.argv.slice(2));

const SRC_FOLDER = ARGV.srcFolder || `${CWD}/input`; // use absolute path
const TARGET_FOLDER = ARGV.targetFolder || `${CWD}/output`; // use absolute path
const ACTIVE_PATH = ARGV.activePath || ``; // pass only subpath to srcFolder to work on
const IS_OPTIMUM = ARGV.isOptimum || false;

squeezr
  .minify({
    srcFolder: SRC_FOLDER,
    targetFolder: TARGET_FOLDER,
    activePath: ACTIVE_PATH,
    isOptimum: IS_OPTIMUM,
    // format: "webp",
  })
  .then(() => {
    console.log("Finish! Go build something awesome 😎");
  });
