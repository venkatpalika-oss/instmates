// Loopback review server: exact public runtime and explicitly allowlisted shared assets.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../public/',import.meta.url);
const allowed=new Set(["assets/js/simulations/oxymitter-4000/training-data.mjs", "assets/js/simulations/oxymitter-4000/diagnostic-engine.mjs", "assets/js/simulations/oxymitter-4000/calibration-data.mjs", "assets/js/simulations/oxymitter-4000/diagnostic-data.mjs", "assets/js/simulations/oxymitter-4000/calibration-engine.mjs", "assets/js/simulations/oxymitter-4000/source-data.mjs", "assets/js/simulations/oxymitter-4000/provenance.mjs", "assets/js/simulations/oxymitter-4000/startup-engine.mjs", "assets/js/simulations/oxymitter-4000/training-engine.mjs", "assets/js/simulations/oxymitter-4000/ui/diagnostic-page.mjs", "assets/js/simulations/oxymitter-4000/ui/training-page.mjs", "assets/js/simulations/oxymitter-4000/ui/calibration-page.mjs", "assets/js/simulations/oxymitter-4000/ui/hardening-page.mjs", "assets/js/simulations/oxymitter-4000/ui/page.mjs", "assets/js/simulations/oxymitter-4000/ui/view-model.mjs", "simulations/oxymitter-4000/index.html", "assets/css/oxymitter-4000.css", "assets/css/style.css", "assets/css/simulations.css", "assets/js/includes.js", "includes/header.html", "includes/footer.html", "assets/brand/instmates-mark-128.png", "favicon.ico", "simulations/index.html", "assets/js/simulations/catalog.js", "assets/js/simulations/catalog-page.js", "assets/css/simulations-catalog.css"]);
export async function startServer({port=0}={}){
 const server=http.createServer(async(req,res)=>{try{
 const path=new URL(req.url,'http://localhost').pathname;
 const file=path.slice(1)+(path.endsWith('/')?'index.html':'');
 if(!allowed.has(file)){res.writeHead(404);res.end('Not found');return;}
 const body=await readFile(new URL(file,root));
 const type={html:'text/html; charset=utf-8',css:'text/css',mjs:'text/javascript',js:'text/javascript',png:'image/png',ico:'image/x-icon'}[file.split('.').pop()];
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);
 }catch{res.writeHead(500);res.end('Local page unavailable');}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return {server,url:`http://127.0.0.1:${server.address().port}/simulations/oxymitter-4000/`};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const {url}=await startServer({port:Number(process.argv[2]??4174)});console.log(`Public-source local review: ${url}`);}
