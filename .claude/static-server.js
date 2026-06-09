const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
http.createServer((req,res)=>{
  let f=path.join(root, req.url==='/'?'/index.html':decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end('nf');return;}
    const ext=path.extname(f); const ct={'.html':'text/html','.js':'application/javascript','.css':'text/css'}[ext]||'text/plain';
    res.writeHead(200,{'Content-Type':ct}); res.end(d); });
}).listen(8731,()=>console.log('up on 8731'));
