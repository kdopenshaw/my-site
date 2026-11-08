const fs=require('fs');
const path=require('path');
const dependencies=fs.existsSync(__dirname+'/node_modules/esbuild')?__dirname+'/node_modules':'/tmp/chartbook-libraries/node_modules';
const esbuild=require(path.join(dependencies,'esbuild'));
esbuild.buildSync({entryPoints:[__dirname+'/charts.jsx'],bundle:true,alias:{react:path.join(dependencies,'react'),'react-dom':path.join(dependencies,'react-dom')},write:false,minify:true,format:'iife',nodePaths:[dependencies],define:{'process.env.NODE_ENV':'"production"'}}).outputFiles.forEach(file=>{
 const css=fs.readFileSync(__dirname+'/style.css','utf8');
 fs.writeFileSync(__dirname+'/index.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI dilemmas — chart library comparison</title><style>'+css+'</style></head><body><div id="root"></div><script>'+file.text.replace(/<\/script/gi,'<\\/script')+'</script></body></html>');
});
console.log('Built self-contained index.html');
