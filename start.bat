@echo off
title Calculadora Dropshipping | piercer
cd /d "%~dp0"
node -v >nul 2>nul
if %errorlevel%==0 (
    start "" "http://localhost:8105"
    node -e "const h=require('http'),f=require('fs'),p=require('path');const m={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8'};h.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/')u='/index.html';let fp=p.join(process.cwd(),u);f.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404')}s.writeHead(200,{'Content-Type':m[p.extname(fp)]||'application/octet-stream'});s.end(d)})}).listen(8105);"
    goto :eof
)
start "" "%~dp0index.html"
