(() => {
const $=id=>document.getElementById(id), S=window.Solver,G=window.Game, KEY='guess-web-v1';
let game;try{game=G.restore(JSON.parse(localStorage.getItem(KEY)))||G.fresh();}catch(e){game=G.fresh();}
let feedback=-1,busy=false,state;
const chips=(digits)=>digits.length?digits.map(d=>'<span class="chip">'+d+'</span>').join(''):'<span class="none">暂无</span>';
function save(){try{localStorage.setItem(KEY,JSON.stringify(game));$('saveHint').textContent='';}catch(e){$('saveHint').textContent='保存不可用，关闭后本局可能丢失';}}
function validate(){const v=$('guess').value,error=v?S.validateGuess(v):'';$('inputHint').textContent=error||'4 位数字互不重复 · 允许以 0 开头';$('inputHint').className='hint'+(error?' error':'');$('submitBtn').disabled=busy||state.won||state.conflict||!!S.validateGuess(v)||(game.mode==='assist'&&feedback<0);}
function render(){
 state=G.replay(game); feedback=-1;
 $('assistTab').className=game.mode==='assist'?'active':'';$('practiceTab').className=game.mode==='practice'?'active':'';
 $('assistTab').setAttribute('aria-pressed',game.mode==='assist');$('practiceTab').setAttribute('aria-pressed',game.mode==='practice');
 const won=state.won, practice=game.mode==='practice', rounds=game.history.filter((r,i)=>!state.steps[i].conflict).length;
 $('heroLabel').textContent=won?'猜中了，漂亮！':practice?'找出我的 4 个秘密数字':state.candidates.length===1?'就是它了，下一轮必中':'下一轮，推荐你猜';
 const digits=won?state.recommendation:practice?'????':state.recommendation;
 $('heroDigits').innerHTML=digits.split('').map(d=>'<span class="digit">'+d+'</span>').join('');
 $('heroHint').textContent=won?'用 '+rounds+' 轮猜中了全部数字':practice?'只看数字，不看位置':'还剩 '+state.candidates.length+' 种可能';
 $('roundBadge').textContent=won?'完成':'第 '+(rounds+1)+' 轮';
 $('guessLabel').textContent=practice?'输入你的猜测':'实际猜的数字';$('guess').value=!practice&&!won?state.recommendation:'';
 $('guess').disabled=won||state.conflict||(!practice&&state.candidates.length===1);$('feedbackField').hidden=practice||won||state.conflict;
 $('guessForm').hidden=won||state.conflict;$('status').hidden=!won&&!state.conflict;
 $('status').className='status'+(won?' win':'');$('status').textContent=won?'已找到全部数字 '+state.recommendation+'。你可以再来一局，或撤销最后一轮。':state.conflict?'记录有矛盾，请检查上一轮的反馈。候选保留在上一有效状态，请撤销红色记录后修正。':'';
 $('submitBtn').textContent=practice?'提交猜测':'确认本轮 · 获取推荐';$('resetBtn').textContent=won?'再来一局':'重新开始';$('undoBtn').disabled=!game.history.length;
 document.querySelectorAll('[data-feedback]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});
 $('analysisContext').textContent=state.conflict?'以下结论来自上一有效轮次，尚未采用矛盾反馈。':'依据 '+rounds+' 轮有效反馈，剩余 '+state.candidates.length+' 种组合。';
 ['certain','possible','excluded'].forEach(k=>{$(k).innerHTML=chips(state[k]);$(k).className='chips '+k;});
 $('candidateCount').textContent=state.candidates.length+' 组';$('candidates').innerHTML=state.candidates.map(c=>'<span class="combo">'+c.join('')+'</span>').join('');
 $('frequency').innerHTML=state.counts.map((n,d)=>'<div class="frequency-row"><strong>'+d+'</strong><div class="bar"><i style="width:'+(100*n/state.candidates.length)+'%"></i></div><span class="count">'+n+' / '+state.candidates.length+'</span></div>').join('');
 $('historyCount').textContent=game.history.length+' 条';
 $('history').innerHTML=!game.history.length?'<div class="empty">第一轮的线索，从这里开始。</div>':state.steps.map((r,i)=>{
 let body=r.conflict?'<p>你的反馈要求交集为 <b>'+r.feedback+'</b>，但已有候选中没有任何组合符合。不能据此确定数字；请检查本轮或更早的反馈。</p>':'<p>保留与 <b>'+r.guess+'</b> 恰好有 <b>'+r.feedback+'</b> 个共同数字的组合，排除其余 <b>'+r.removed+'</b> 组。</p>';
 body+='<div class="flow"><span>'+r.before+' 组</span>→<span>'+r.after+' 组'+(r.conflict?'（矛盾）':'')+'</span></div>';
 body+='<p><b>已确定：</b>'+ (r.certain.join('、')||'暂时没有')+'<br><b>仍可能：</b>'+(r.possible.join('、')||'暂无')+'<br><b>已排除：</b>'+(r.excluded.join('、')||'暂无')+'</p>';
 if(r.conflict)body+='<p>上方数字结论保持在上一有效状态。</p>';
 else if(r.feedback===0)body+='<p>本轮猜的 '+r.guess.split('').join('、')+' 全部不在秘密中。</p>';
 else if(r.feedback===4)body+='<p>这 4 个数字全部命中，对局完成。顺序不影响结果。</p>';
 else body+='<p>这不表示知道具体中了哪 '+r.feedback+' 个；确定数字由全部历史记录共同约束。</p>';
 if(!r.conflict&&r.feedback!==4&&!practice){const rec=S.recommend(r.candidates),buckets=[0,0,0,0,0];r.candidates.forEach(c=>buckets[S.hit(rec,c)]++);body+='<p><b>为何推荐 '+rec.join('')+'：</b>在当前候选中，它让最坏情况下的剩余组合数最少，并列时选第一组。</p><p>若下一轮命中 0 / 1 / 2 / 3 / 4 个，分别剩 '+buckets.join(' / ')+' 组。最坏剩 '+Math.max(...buckets)+' 组。</p>';}
 body+='<details><summary>查看本轮'+(r.conflict?'之前有效的':'之后的')+'候选组合（'+r.candidates.length+' 组）</summary><div class="combos">'+r.candidates.map(c=>'<span class="combo">'+c.join('')+'</span>').join('')+'</div></details>';
 return '<details class="history-step '+(r.conflict?'bad':'')+'" '+(i===state.steps.length-1?'open':'')+'><summary><span class="round-no">第 '+r.index+' 轮</span><strong>'+r.guess+'</strong><span class="result">'+(r.conflict?'反馈矛盾':'中 '+r.feedback+' 个')+'</span></summary><div class="step-body">'+body+'</div></details>';
 }).join('');validate();
}
$('guess').addEventListener('input',validate);
document.querySelectorAll('[data-feedback]').forEach(b=>b.onclick=()=>{feedback=+b.dataset.feedback;document.querySelectorAll('[data-feedback]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',x===b);});validate();});
$('guessForm').onsubmit=e=>{e.preventDefault();if(busy||$('submitBtn').disabled)return;busy=true;try{game=G.submit(game,$('guess').value,feedback);save();render();}catch(e){alert(e.message);}setTimeout(()=>{busy=false;validate();},500);};
$('undoBtn').onclick=()=>{if(busy||!game.history.length)return;game.history.pop();save();render();};
$('resetBtn').onclick=()=>{if(busy)return;if(game.history.length&&!confirm('清空当前局记录，重新开始？'))return;game=G.fresh(game.mode);clearOwn();save();render();};
function switchMode(mode){if(busy||game.mode===mode)return;if(game.history.length&&!confirm('切换模式会清空当前局，继续？'))return;game=G.fresh(mode);save();render();}
$('assistTab').onclick=()=>switchMode('assist');$('practiceTab').onclick=()=>switchMode('practice');
$('rulesBtn').onclick=()=>{if($('rules').showModal)$('rules').showModal();else $('rules').setAttribute('open','');};$('closeRules').onclick=()=>{if($('rules').close)$('rules').close();else $('rules').removeAttribute('open');};
$('shareBtn').onclick=async()=>{const url=location.href.split('#')[0].split('?')[0];try{await navigator.clipboard.writeText(url);$('shareBtn').textContent='链接已复制，发给朋友吧';}catch(e){prompt('复制这个链接发送给朋友',url);}};
const OWN_KEY='guess-web-own-v1';let ownSecret='';
try{const saved=localStorage.getItem(OWN_KEY);if(saved&&!S.validateGuess(saved))ownSecret=saved;}catch(e){}
function updateOwnBadge(){$('ownBadge').textContent=ownSecret?'已记录 · '+ownSecret:'未记录';}
function ownFeedback(){
 const guess=$('opponentGuess').value, result=$('opponentResult');result.className='opponent-result';
 if(!ownSecret){result.textContent='先保存自己的数字，再输入朋友的猜测。';return;}
 if(!guess){result.textContent='输入朋友的猜测，自动计算命中数。';return;}
 const error=S.validateGuess(guess);if(error){result.textContent=error;result.classList.add('error');return;}
 if($('ownSecret').value!==ownSecret){result.textContent='自己的数字已修改，请先保存再核对。';return;}
 const n=S.hit(guess,ownSecret);result.innerHTML='告诉朋友：中了 <strong>'+n+'</strong> 个'+(n===4?'，全部猜中了！':'。');
}
function validateOwn(){const v=$('ownSecret').value,error=v?S.validateGuess(v):'';$('saveOwn').disabled=!!S.validateGuess(v);$('ownValidation').textContent=error||'4 位数字不能重复，顺序不影响命中。';$('ownValidation').className='hint'+(error?' error':'');ownFeedback();}
function clearOwn(){ownSecret='';$('ownSecret').value='';$('opponentGuess').value='';try{localStorage.removeItem(OWN_KEY);}catch(e){}updateOwnBadge();validateOwn();}
$('ownBtn').onclick=()=>{$('ownSecret').value=ownSecret;$('opponentGuess').value='';validateOwn();if($('ownDialog').showModal)$('ownDialog').showModal();else $('ownDialog').setAttribute('open','');};
$('closeOwn').onclick=()=>{if($('ownDialog').close)$('ownDialog').close();else $('ownDialog').removeAttribute('open');};
$('ownSecret').addEventListener('input',validateOwn);$('opponentGuess').addEventListener('input',ownFeedback);
$('ownForm').onsubmit=e=>{e.preventDefault();if(S.validateGuess($('ownSecret').value))return;ownSecret=$('ownSecret').value;try{localStorage.setItem(OWN_KEY,ownSecret);$('ownValidation').textContent='已保存，可以直接查看数字。';}catch(e){$('ownValidation').textContent='本次已记录，浏览器保存不可用，关闭后可能丢失。';}updateOwnBadge();ownFeedback();};
$('clearOwn').onclick=clearOwn;updateOwnBadge();
render();
})();
