(function(){
const S = typeof module !== 'undefined' ? require('./solver') : window.Solver;
function analyze(candidates) {
 const counts=Array(10).fill(0); candidates.forEach(c=>c.forEach(d=>counts[+d]++));
 return {counts, certain:counts.map((n,d)=>n===candidates.length && n>0 ? String(d):null).filter(d=>d!==null), possible:counts.map((n,d)=>n>0 && n<candidates.length?String(d):null).filter(d=>d!==null), excluded:counts.map((n,d)=>n===0?String(d):null).filter(d=>d!==null)};
}
function fresh(mode='assist'){return {version:1,mode,history:[],secret:mode==='practice'?S.ALL_COMBOS[Math.floor(Math.random()*210)].join(''):''};}
function replay(game){
 let candidates=S.ALL_COMBOS.slice(),won=false,conflict=false;
 const steps=game.history.map((r,i)=>{const before=candidates; const filtered=S.filterCandidates(before,r.guess,r.feedback); const bad=!filtered.length;
 if(!bad)candidates=filtered; else conflict=true;
 if(!bad&&r.feedback===4)won=true;
 return {...r,index:i+1,before:before.length,after:filtered.length,removed:before.length-filtered.length,conflict:bad,candidates:candidates.slice(),...analyze(candidates)};
 });
 return {candidates,won,conflict,steps,...analyze(candidates),recommendation:S.recommend(candidates).join('')};
}
function submit(game,guess,feedback){
 const error=S.validateGuess(guess); if(error)throw Error(error);
 const state=replay(game); if(state.won||state.conflict)throw Error('请先撤销最后一轮或重新开始');
 if(game.mode==='practice')feedback=S.hit(guess,game.secret);
 if(!Number.isInteger(feedback)||feedback<0||feedback>4)throw Error('请选择命中数（0～4）');
 return {...game,history:game.history.concat([{guess,feedback}])};
}
function restore(raw){
 if(!raw||raw.version!==1||!['assist','practice'].includes(raw.mode)||!Array.isArray(raw.history)||raw.history.length>500)return null;
 if(raw.mode==='practice'&&S.validateGuess(raw.secret))return null;
 let game={version:1,mode:raw.mode,secret:raw.mode==='practice'?raw.secret:'',history:[]};
 try{for(const r of raw.history){if(!r||S.validateGuess(r.guess)||!Number.isInteger(r.feedback))return null; game=submit(game,r.guess,r.feedback);if(game.history[game.history.length-1].feedback!==r.feedback)return null;}return game;}catch(e){return null;}
}
const model={analyze,fresh,replay,submit,restore}; if(typeof module!=='undefined')module.exports=model;else window.Game=model;
})();
