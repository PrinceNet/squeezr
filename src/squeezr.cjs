const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const cliProgress = require("cli-progress");

class Squeezr {
  #getFilesByFileExt(dir, _ext, _files) {
    _files = _files || [];
    _ext = _ext || false;
    const files = fs.readdirSync(dir);

    for (const i in files) {
      const name = `${dir}/${files[i]}`;

      if (fs.statSync(name).isDirectory()) {
        this.#getFilesByFileExt(name, _ext, _files);
      } else {
        if (typeof _ext === "string") {
          if (name.indexOf(_ext) > 0) {
            _files.push(name);
          }
        } else if (Array.isArray(_ext)) {
          for (let extIndex = 0; extIndex < _ext.length; extIndex++) {
            const currentExt = _ext[extIndex];

            if (name.indexOf(currentExt) > 0) {
              _files.push(name);
            }
          }
        }
      }
    }

    return _files.map((file) => file.split("//").join("/"));
  }

  async #getFolderSize(dir) {
    let totalSize = 0;

    const files = await fs.promises.readdir(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.promises.lstat(filePath);

      if (stat.isDirectory()) {
        totalSize += stat.size;
        totalSize += await this.#getFolderSize(filePath);
      } else {
        totalSize += stat.size;
      }
    }

    return totalSize;
  }

  #formatBytes(bytes) {
    if (bytes < 1024) {
      return bytes + " Bytes";
    } else if (bytes < 1048576) {
      return (bytes / 1024).toFixed(2) + " KB";
    } else if (bytes < 1073741824) {
      return (bytes / 1048576).toFixed(2) + " MB";
    } else {
      return (bytes / 1073741824).toFixed(2) + " GB";
    }
  }

  #showResults(_options) {
    return new Promise(async (resolve, reject) => {
      try {
        const srcBytes = await this.#getFolderSize(_options.srcFolder);
        const targetBytes = await this.#getFolderSize(_options.targetFolder);
        const saved = `saved ${((1 - targetBytes / srcBytes) * 100).toFixed(2)} %`;
        const msg = `${saved} (src: ${this.#formatBytes(srcBytes)}, target: ${this.#formatBytes(targetBytes)})`;

        console.log(`squeezr:: ${msg}`);

        resolve();
      } catch (error) {
        reject(`squeezr:: ${error}`);
      }
    });
  }

  #minifyPngImage(_options = {}) {
    const formatParams = { effort: 10, quality: 100, compressionLevel: 9, adaptiveFiltering: true };

    return new Promise(async (resolve, reject) => {
      try {
        await sharp(_options.srcPath).png(formatParams).toFile(_options.targetPath);

        resolve();
      } catch (error) {
        reject(`squeezr:: ${error}`);
      }
    });
  }

  #minifyJpgImage(_options = {}) {
    const formatParams = { mozjpeg: true };

    return new Promise(async (resolve, reject) => {
      try {
        await sharp(_options.srcPath).jpeg(formatParams).toFile(_options.targetPath);

        resolve();
      } catch (error) {
        reject(`squeezr:: ${error}`);
      }
    });
  }

  #minifyWebpImage(_options = {}) {
    const formatParams = { effort: 6, quality: 75 };

    return new Promise(async (resolve, reject) => {
      try {
        await sharp(_options.srcPath, {
          animated: false,
        })
          .webp(formatParams)
          .toFile(_options.targetPath);

        resolve();
      } catch (error) {
        reject(`squeezr:: ${error}`);
      }
    });
  }

  #minifyAvifImage(_options = {}) {
    const formatParams = { effort: 6, quality: 75, chromaSubsampling: "4:2:0" };

    return new Promise(async (resolve, reject) => {
      try {
        await sharp(_options.srcPath).avif(formatParams).toFile(_options.targetPath);

        resolve();
      } catch (error) {
        reject(`squeezr:: ${error}`);
      }
    });
  }

  #minifySingleImage(_options = {}) {
    if (!_options.srcPath) {
      throw new Error(`squeezr:: no 'srcPath' provided !`);
    }

    if (!_options.targetPath) {
      throw new Error(`squeezr:: no 'targetPath' provided !`);
    }

    const _srctExt = path.extname(_options.srcPath);
    const _targetExt = _options.format ? `.${_options.format}` : _srctExt;

    return new Promise((resolve, reject) => {
      try {
        (async () => {
          const _targetFileName = path.basename(_options.srcPath, _srctExt);

          if (!fs.existsSync(_options.targetPath)) {
            fs.mkdirSync(_options.targetPath, { recursive: true });
          }

          const _imgTargetPath = `${_options.targetPath}/${_targetFileName}${_targetExt}`;

          if (_targetExt === ".png") {
            await this.#minifyPngImage({
              srcPath: _options.srcPath,
              targetPath: _imgTargetPath,
            });
          } else if (_targetExt === ".jpg" || _targetExt === ".jpeg") {
            await this.#minifyJpgImage({
              srcPath: _options.srcPath,
              targetPath: _imgTargetPath,
            });
          } else if (_targetExt === ".webp") {
            await this.#minifyWebpImage({
              srcPath: _options.srcPath,
              targetPath: _imgTargetPath,
            });
          } else if (_targetExt === ".avif") {
            await this.#minifyAvifImage({
              srcPath: _options.srcPath,
              targetPath: _imgTargetPath,
            });
          }

          resolve();
        })();
      } catch (error) {
        reject(`squeezr:: ${error}`);
      }
    });
  }

  #refreshDir(dir) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
      fs.mkdirSync(dir);
    }
  }

  minify(_options = {}) {
    console.time("squeezr:: minify complete");

    _options.activePath = _options.activePath || "";

    if (!_options.srcFolder) {
      throw new Error(`squeezr:: no 'srcFolder' provided !`);
    }

    if (!_options.targetFolder) {
      throw new Error(`squeezr:: no 'targetFolder' provided !`);
    }

    if (!_options.format) {
      _options.format = null;
      console.warn(`squeezr:: no 'format' provided, uses the source file format dynamically`);
    }

    const _activePath = _options.activePath ? `${_options.targetFolder}/${_options.activePath}` : _options.targetFolder;

    console.log(`squeezr:: source folder: ${_options.srcFolder}`);
    console.log(`squeezr:: target folder: ${_options.targetFolder}`);
    console.log(`squeezr:: active path: ${_activePath}`);
    console.log(`squeezr:: format: ${_options.format === null ? "dynamic" : _options.format}`);

    return new Promise(async (resolve, reject) => {
      try {
        const _validFileExt = [".png", ".jpg", ".jpeg"];
        const _imgFiles = this.#getFilesByFileExt(`${_options.srcFolder}/${_options.activePath}`, _validFileExt);
        const _bar = new cliProgress.SingleBar(
          { format: "squeezr:: minifying... {bar} {percentage}% | ETA: {eta}s | {value}/{total}" },
          cliProgress.Presets.shades_classic
        );

        this.#refreshDir(_activePath);
        fs.writeFileSync(`${_options.targetFolder}/.gitignore`, "*\n!.gitignore");

        const PQueue = (await import("p-queue")).default;
        let _queue = new PQueue();
        let _doneCount = 0;

        _bar.start(_imgFiles.length, 0);

        for (let index = 0; index < _imgFiles.length; index++) {
          const _srcFilePath = _imgFiles[index];
          const _targetFilePath = path.dirname(
            _srcFilePath.replace(`${_options.srcFolder}/`, `${_options.targetFolder}/`)
          );

          (async () => {
            await _queue.add(() =>
              this.#minifySingleImage({
                srcPath: _srcFilePath,
                targetPath: _targetFilePath,
                format: _options.format,
              })
            );

            const _isDoneAll = ++_doneCount === _imgFiles.length;

            _bar.update(_doneCount);

            if (_isDoneAll) {
              _bar.stop();

              await this.#showResults({
                srcFolder: _options.srcFolder,
                targetFolder: _options.targetFolder,
              });

              console.timeEnd("squeezr:: minify complete");

              resolve();
            }
          })();
        }
      } catch (error) {
        reject(`squeezr:: ${error}`);
      }
    });
  }
}

module.exports = new Squeezr();
