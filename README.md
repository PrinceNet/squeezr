# squeezr

squeezr is a node CLI tool for convert and minify images written in Javascript.

## Installation

Use the package manager [npm](https://www.npmjs.com) to install squeezr.

```bash
npm i -g squeezr
```

## Usage

Simple as that

```shell
squeezr --srcFolder="/absolute_path/in" --targetFolder="/absolute_path/out"
```

Or if you want a portion of files to be compressed you can pass `--activePath` to work as a subpath

```shell
squeezr --srcFolder="/absolute_path/in" --targetFolder="/absolute_path/out" --activePath="only_this_folder"
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)
