((t,e)=>{"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).BiggerPicture=e()})(this,(function(){var t;function e(){}const n=t=>t;function o(t,e){for(const n in e)t[n]=e[n];return t}function i(t){return t()}function r(){return Object.create(null)}function s(t){t.forEach(i)}function l(t){return"function"==typeof t}function c(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}let u;function a(t,e){return u||(u=document.createElement("a")),u.href=e,t===u.href}function d(t,e){return t!=t?e==e:t!==e}function f(t,n,o){t.$$.on_destroy.push(((t,...n)=>{if(null==t)return e;const o=t.subscribe(...n);return o.unsubscribe?()=>o.unsubscribe():o})(n,o))}function p(t,e,n){return t.set(n),e}function m(t){return t&&l(t.destroy)?t.destroy:e}const h="undefined"!=typeof window;let g=h?()=>window.performance.now():()=>Date.now(),$=h?t=>requestAnimationFrame(t):e;const y=new Set;function b(t){y.forEach((e=>{e.c(t)||(y.delete(e),e.f())})),0!==y.size&&$(b)}function v(t){let e;return 0===y.size&&$(b),{promise:new Promise((n=>{y.add(e={c:t,f:n})})),abort(){y.delete(e)}}}function x(t,e){t.appendChild(e)}function w(t){if(!t)return document;const e=t.getRootNode?t.getRootNode():t.ownerDocument;return e&&e.host?e:t.ownerDocument}function _(t){const e=E("style");return((t,e)=>{x(t.head||t,e)})(w(t),e),e.sheet}function I(t,e,n){t.insertBefore(e,n||null)}function k(t){t.parentNode.removeChild(t)}function C(t,e){for(let n=0;t.length>n;n+=1)t[n]&&t[n].d(e)}function E(t){return document.createElement(t)}function D(t){return document.createTextNode(t)}function A(){return D(" ")}function S(){return D("")}function z(t,e,n,o){return t.addEventListener(e,n,o),()=>t.removeEventListener(e,n,o)}function H(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function N(t,e){const n=Object.getOwnPropertyDescriptors(t.__proto__);for(const o in e)null==e[o]?t.removeAttribute(o):"style"===o?t.style.cssText=e[o]:"__value"===o?t.value=t[o]=e[o]:n[o]&&n[o].set?t[o]=e[o]:H(t,o,e[o])}function T(t,e){t.wholeText!==(e=""+e)&&(t.data=e)}function O(t,e,n,o){null===n?t.style.removeProperty(e):t.style.setProperty(e,n,o?"important":"")}function P(t,e,n){t.classList[n?"add":"remove"](e)}class M{constructor(){this.e=this.n=null}c(t){this.h(t)}m(t,e,n=null){this.e||(this.e=E(e.nodeName),this.t=e,this.c(t)),this.i(n)}h(t){this.e.innerHTML=t,this.n=Array.from(this.e.childNodes)}i(t){for(let e=0;this.n.length>e;e+=1)I(this.t,this.n[e],t)}p(t){this.d(),this.h(t),this.i(this.a)}d(){this.n.forEach(k)}}const R=new Map;let Y,W=0;function L(t,e,n,o,i,r,s,l=0){const c=16.666/o;let u="{\n";for(let t=0;1>=t;t+=c){const o=e+(n-e)*r(t);u+=100*t+`%{${s(o,1-o)}}\n`}const a=u+`100% {${s(n,1-n)}}\n}`,d=`__svelte_${(t=>{let e=5381,n=t.length;for(;n--;)e=(e<<5)-e^t.charCodeAt(n);return e>>>0})(a)}_${l}`,f=w(t),{stylesheet:p,rules:m}=R.get(f)||((t,e)=>{const n={stylesheet:_(e),rules:{}};return R.set(t,n),n})(f,t);m[d]||(m[d]=1,p.insertRule(`@keyframes ${d} ${a}`,p.cssRules.length));const h=t.style.animation||"";return t.style.animation=`${h?h+", ":""}${d} ${o}ms linear ${i}ms 1 both`,W+=1,d}function j(t,e){const n=(t.style.animation||"").split(", "),o=n.filter(e?t=>0>t.indexOf(e):t=>-1===t.indexOf("__svelte")),i=n.length-o.length;i&&(t.style.animation=o.join(", "),W-=i,W||$((()=>{W||(R.forEach((t=>{const{stylesheet:e}=t;let n=e.cssRules.length;for(;n--;)e.deleteRule(n);t.rules={}})),R.clear())})))}function B(t){Y=t}const X=[],q=[],U=[],F=[],J=Promise.resolve();let K=0;function G(t){U.push(t)}const Q=new Set;let V,Z=0;function tt(){const t=Y;do{for(;X.length>Z;){const t=X[Z];Z++,B(t),et(t.$$)}for(B(null),X.length=0,Z=0;q.length;)q.pop()();for(let t=0;U.length>t;t+=1){const e=U[t];Q.has(e)||(Q.add(e),e())}U.length=0}while(X.length);for(;F.length;)F.pop()();K=0,Q.clear(),B(t)}function et(t){if(null!==t.fragment){t.update(),s(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(G)}}function nt(){return V||(V=Promise.resolve(),V.then((()=>{V=null}))),V}function ot(t,e,n){t.dispatchEvent(((t,e,n=0)=>{const o=document.createEvent("CustomEvent");return o.initCustomEvent(t,n,0,e),o})(`${e?"intro":"outro"}${n}`))}const it=new Set;let rt;function st(){rt={r:0,c:[],p:rt}}function lt(){rt.r||s(rt.c),rt=rt.p}function ct(t,e){t&&t.i&&(it.delete(t),t.i(e))}function ut(t,e,n,o){if(t&&t.o){if(it.has(t))return;it.add(t),rt.c.push((()=>{it.delete(t),o&&(n&&t.d(1),o())})),t.o(e)}}const at={duration:0};function dt(t,o,i){let r,s,c=o(t,i),u=0,a=0;function d(){r&&j(t,r)}function f(){const{delay:o=0,duration:i=300,easing:l=n,tick:f=e,css:p}=c||at;p&&(r=L(t,0,1,i,o,l,p,a++)),f(0,1);const m=g()+o,h=m+i;s&&s.abort(),u=1,G((()=>ot(t,1,"start"))),s=v((e=>{if(u){if(e>=h)return f(1,0),ot(t,1,"end"),d(),u=0;if(e>=m){const t=l((e-m)/i);f(t,1-t)}}return u}))}let p=0;return{start(){p||(p=1,j(t),l(c)?(c=c(),nt().then(f)):f())},invalidate(){p=0},end(){u&&(d(),u=0)}}}function ft(t,o,i){let r,c=o(t,i),u=1;const a=rt;function d(){const{delay:o=0,duration:i=300,easing:l=n,tick:d=e,css:f}=c||at;f&&(r=L(t,1,0,i,o,l,f));const p=g()+o,m=p+i;G((()=>ot(t,0,"start"))),v((e=>{if(u){if(e>=m)return d(0,1),ot(t,0,"end"),--a.r||s(a.c),0;if(e>=p){const t=l((e-p)/i);d(1-t,t)}}return u}))}return a.r+=1,l(c)?nt().then((()=>{c=c(),d()})):d(),{end(e){e&&c.tick&&c.tick(1,0),u&&(r&&j(t,r),u=0)}}}function pt(t,o,i,r){let c=o(t,i),u=r?0:1,a=null,d=null,f=null;function p(){f&&j(t,f)}function m(t,e){const n=t.b-u;return{a:u,b:t.b,d:n,duration:e*=Math.abs(n),start:t.start,end:t.start+e,group:t.group}}function h(o){const{delay:i=0,duration:r=300,easing:l=n,tick:h=e,css:$}=c||at,y={start:g()+i,b:o};o||(y.group=rt,rt.r+=1),a||d?d=y:($&&(p(),f=L(t,u,o,r,i,l,$)),o&&h(0,1),a=m(y,r),G((()=>ot(t,o,"start"))),v((e=>(d&&e>d.start&&(a=m(d,r),d=null,ot(t,a.b,"start"),$&&(p(),f=L(t,u,a.b,a.duration,0,l,c.css))),a&&(a.end>e?a.start>e||(u=a.a+a.d*l((e-a.start)/a.duration),h(u,1-u)):(h(u=a.b,1-u),ot(t,a.b,"end"),d||(a.b?p():--a.group.r||s(a.group.c)),a=null)),!(!a&&!d)))))}return{run(t){l(c)?nt().then((()=>{c=c(),h(t)})):h(t)},end(){p(),a=d=null}}}const mt="undefined"!=typeof window?window:"undefined"!=typeof globalThis?globalThis:global;function ht(t,e){const n={},o={},i={$$scope:1};let r=t.length;for(;r--;){const s=t[r],l=e[r];if(l){for(const t in s)t in l||(o[t]=1);for(const t in l)i[t]||(n[t]=l[t],i[t]=1);t[r]=l}else for(const t in s)i[t]=1}for(const t in o)t in n||(n[t]=void 0);return n}function gt(t){t&&t.c()}function $t(t,e,n,o){const{fragment:r,on_mount:c,on_destroy:u,after_update:a}=t.$$;r&&r.m(e,n),o||G((()=>{const e=c.map(i).filter(l);u?u.push(...e):s(e),t.$$.on_mount=[]})),a.forEach(G)}function yt(t,e){const n=t.$$;null!==n.fragment&&(s(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function bt(t,n,o,i,l,c,u,a=[-1]){const d=Y;B(t);const f=t.$$={fragment:null,ctx:null,props:c,update:e,not_equal:l,bound:r(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(n.context||(d?d.$$.context:[])),callbacks:r(),dirty:a,skip_bound:0,root:n.target||d.$$.root};u&&u(f.root);let p=0;f.ctx=o?o(t,n.props||{},((e,n,...o)=>{const i=o.length?o[0]:n;return f.ctx&&l(f.ctx[e],f.ctx[e]=i)&&(!f.skip_bound&&f.bound[e]&&f.bound[e](i),p&&function(t,e){-1===t.$$.dirty[0]&&(X.push(t),K||(K=1,J.then(tt)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}(t,e)),n})):[],f.update(),p=1,s(f.before_update),f.fragment=i?i(f.ctx):0,n.target&&(f.fragment&&f.fragment.c(),n.intro&&ct(t.$$.fragment),$t(t,n.target,n.anchor,n.customElement),tt()),B(d)}class vt{$destroy(){yt(this,1),this.$destroy=e}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(t){this.$$set&&0!==Object.keys(t).length&&(this.$$.skip_bound=1,this.$$set(t),this.$$.skip_bound=0)}}function xt(t){const e=t-1;return e*e*e+1}function wt(t,{delay:e=0,duration:o=400,easing:i=n}={}){const r=+getComputedStyle(t).opacity;return{delay:e,duration:o,easing:i,css:t=>"opacity: "+t*r}}function _t(t,{delay:e=0,duration:n=400,easing:o=xt,x:i=0,y:r=0,opacity:s=0}={}){const l=getComputedStyle(t),c=+l.opacity,u="none"===l.transform?"":l.transform,a=c*(1-s);return{delay:e,duration:n,easing:o,css:(t,e)=>`\n\t\t\ttransform: ${u} translate(${(1-t)*i}px, ${(1-t)*r}px);\n\t\t\topacity: ${c-a*e}`}}const It=[];function kt(t,n=e){let o;const i=new Set;function r(e){if(c(t,e)&&(t=e,o)){const e=!It.length;for(const e of i)e[1](),It.push(e,t);if(e){for(let t=0;It.length>t;t+=2)It[t][0](It[t+1]);It.length=0}}}return{set:r,update(e){r(e(t))},subscribe(s,l=e){const c=[s,l];return i.add(c),1===i.size&&(o=n(r)||e),s(t),()=>{i.delete(c),0===i.size&&(o(),o=null)}}}}function Ct(t,e){if(t===e||t!=t)return()=>t;const n=typeof t;if(Array.isArray(t)){const n=e.map(((e,n)=>Ct(t[n],e)));return t=>n.map((e=>e(t)))}if("number"===n){const n=e-t;return e=>t+e*n}}function Et(t,e={}){const i=kt(t);let r,s=t;function l(l,c){if(null==t)return i.set(t=l),Promise.resolve();s=l;let u=r,a=0,{delay:d=0,duration:f=400,easing:p=n,interpolate:m=Ct}=o(o({},e),c);if(0===f)return u&&(u.abort(),u=null),i.set(t=s),Promise.resolve();const h=g()+d;let $;return r=v((e=>{if(h>e)return 1;a||($=m(t,l),"function"==typeof f&&(f=f(t,l)),a=1),u&&(u.abort(),u=null);const n=e-h;return n>f?(i.set(t=l),0):(i.set(t=$(p(n/f))),1)})),r.promise}return{set:l,update:(e,n)=>l(e(s,t),n),subscribe:i.subscribe}}const Dt=kt(0),At=kt(0);function St(t){let e,n,o,i,r=!t[2]&&zt();return{c(){e=E("div"),r&&r.c(),H(e,"class","bp-load"),O(e,"background-image","url("+t[0]+")")},m(t,n){I(t,e,n),r&&r.m(e,null),i=1},p(n,o){(t=n)[2]?r&&(r.d(1),r=null):r||(r=zt(),r.c(),r.m(e,null)),(!i||1&o)&&O(e,"background-image","url("+t[0]+")")},i(r){i||(G((()=>{o&&o.end(1),n=dt(e,wt,{duration:t[2]?300:0}),n.start()})),i=1)},o(t){n&&n.invalidate(),t&&(o=ft(e,wt,{duration:200})),i=0},d(t){t&&k(e),r&&r.d(),t&&o&&o.end()}}}function zt(t){let e,n,o;return{c(){e=E("span"),n=A(),o=E("span"),H(e,"class","bp-bar"),H(o,"class","bp-o")},m(t,i){I(t,e,i),I(t,n,i),I(t,o,i)},d(t){t&&k(e),t&&k(n),t&&k(o)}}}function Ht(t){let e,n=(!t[1]||t[2])&&St(t);return{c(){n&&n.c(),e=S()},m(t,o){n&&n.m(t,o),I(t,e,o)},p(t,[o]){!t[1]||t[2]?n?(n.p(t,o),6&o&&ct(n,1)):(n=St(t),n.c(),ct(n,1),n.m(e.parentNode,e)):n&&(st(),ut(n,1,1,(()=>{n=null})),lt())},i(t){ct(n)},o(t){ut(n)},d(t){n&&n.d(t),t&&k(e)}}}function Nt(t,e,n){let o;f(t,Dt,(t=>n(2,o=t)));let{thumb:i}=e,{loaded:r}=e;return t.$$set=t=>{"thumb"in t&&n(0,i=t.thumb),"loaded"in t&&n(1,r=t.loaded)},[i,r,o]}class Tt extends vt{constructor(t){super(),bt(this,t,Nt,Ht,c,{thumb:0,loaded:1})}}function Ot(t){let n,o,i,r;return{c(){n=E("img"),a(n.src,o=t[4])||H(n,"src",o),H(n,"alt",t[6])},m(t,e){I(t,n,e),r=1},p:e,i(t){r||(i&&i.end(1),r=1)},o(t){i=ft(n,wt,{}),r=0},d(t){t&&k(n),t&&i&&i.end()}}}function Pt(t){let e,n,o,i,r,l,c;o=new Tt({props:{thumb:t[5],loaded:t[1]}});let u=t[1]&&Ot(t);return{c(){e=E("div"),n=E("div"),gt(o.$$.fragment),i=A(),u&&u.c(),O(n,"background-image","url("+t[5]+")"),O(n,"transform","translate3d("+t[3][0]+"px, "+t[3][1]+"px, 0px)"),H(e,"class","bp-item bp-img"),O(e,"width",t[0][0]+"px"),O(e,"height",t[0][1]+"px"),P(e,"dragging",t[2])},m(s,a){I(s,e,a),x(e,n),$t(o,n,null),x(n,i),u&&u.m(n,null),r=1,l||(c=[z(window,"resize",t[21]),z(n,"wheel",t[9]),z(n,"pointerdown",t[10]),z(n,"pointermove",t[11]),z(n,"pointerup",t[12]),z(n,"pointercancel",t[12]),m(t[14].call(null,e))],l=1)},p(t,i){const s={};2&i[0]&&(s.loaded=t[1]),o.$set(s),t[1]?u?(u.p(t,i),2&i[0]&&ct(u,1)):(u=Ot(t),u.c(),ct(u,1),u.m(n,null)):u&&(st(),ut(u,1,1,(()=>{u=null})),lt()),(!r||8&i[0])&&O(n,"transform","translate3d("+t[3][0]+"px, "+t[3][1]+"px, 0px)"),(!r||1&i[0])&&O(e,"width",t[0][0]+"px"),(!r||1&i[0])&&O(e,"height",t[0][1]+"px"),4&i[0]&&P(e,"dragging",t[2])},i(t){r||(ct(o.$$.fragment,t),ct(u),r=1)},o(t){ut(o.$$.fragment,t),ut(u),r=0},d(t){t&&k(e),yt(o),u&&u.d(),l=0,s(c)}}}function Mt(t,e,n){let o,i,r,s;f(t,At,(t=>n(33,r=t))),f(t,Dt,(t=>n(20,s=t)));let l,c,u,a,d,m,h,g,$,y,{stuff:b}=e,{containerWidth:v}=e,{containerHeight:x}=e,{smallScreen:w}=e,{activeItem:_,calculateDimensions:I,loadImage:k,preloadNext:C,opts:E,prev:D,next:A,close:S,toggleControls:z}=b,{img:H,thumb:N,alt:T,width:O,height:P}=_,{inline:M}=E,R=+O,Y=+P,W=I(R,Y),L=[],j=[],B=0;const X=Et(W,{easing:xt});f(t,X,(t=>n(0,i=t)));const q=Et([0,0],{easing:xt});f(t,q,(t=>n(3,o=t)));const U=([t,e])=>{let n=(i[0]-v)/2,o=(i[1]-x)/2;return 0>n?t=0:t>n?w?(t=a?n+(t-n)/10:n)>n+20&&(u=1,D()):t=n:-1*n>t&&(w?-1*n-20>(t=a?-1*n-(-1*n-t)/10:-1*n)&&(u=1,A()):t=-1*n),0>o?e=0:e>o?e=o:-1*o>e&&(e=-1*o),[t,e]},F=(t,e=5)=>{let n=i[0]+i[0]*e,r=i[1]+i[1]*e;if(e>0&&n>R)n=R,r=Y;else if(0>e){let t=I(R,Y);if(t[0]>n)return p(X,i=t,i),void p(q,o=[0,0],o)}if(p(X,i=[n,r],i),1>e)return void p(q,o=U(o),o);let{x:s,y:l,width:c,height:u}=t.target.getBoundingClientRect(),a=t.clientX-s-c/2,d=t.clientY-l-u/2;s=-1*a*(n/c)+a,l=-1*d*(r/u)+d,p(q,o=U([s,l]),o)},J=t=>[t.clientX,t.clientY],K=()=>{n(19,W=I(R,Y)),w||(p(X,i=W,i),p(q,o=[0,0],o))};return t.$$set=t=>{"stuff"in t&&n(15,b=t.stuff),"containerWidth"in t&&n(16,v=t.containerWidth),"containerHeight"in t&&n(17,x=t.containerHeight),"smallScreen"in t&&n(18,w=t.smallScreen)},t.$$.update=()=>{524289&t.$$.dirty[0]&&p(At,r=i[0]>W[0],r),1048576&t.$$.dirty[0]&&s&&!E.intro&&p(q,o=[0,0],o)},[i,l,a,o,H,N,T,X,q,t=>{M&&!r||(t.preventDefault(),F(t,0>t.deltaY?.2:-.2))},t=>{if(2!==t.button){t.preventDefault(),n(2,a=1),L.push(t);let[e,i]=J(t);m=e,h=i,g=o[0],$=o[1]}},t=>{if(L.length>1)return c=1,n(2,a=0),(t=>{L=L.map((e=>e.pointerId==t.pointerId?t:e));let[e,n]=L,o=Math.hypot(e.clientX-n.clientX,e.clientY-n.clientY);B||(B=o),F(t,-.02*(B-o)),B=o})(t);if(u||!a)return;let[e,o]=J(t);j.push({x:e,y:o}),e-=m,o-=h,r||(e>40&&(D(),u=1),-40>e&&(A(),u=1),-90>o&&(S(),u=1)),r&&Math.hypot(e,o)>10&&(d=1,q.set(U([g+e,$+o]),{duration:0}))},t=>{if(L=L.filter((e=>e.pointerId!=t.pointerId)),c)return c=L.length?1:0,void(B=0);if(!u&&a){if(n(2,a=0),w?d||(y?(clearTimeout(y),F(t,r?-5:5),y=0):y=setTimeout((()=>{z(),y=0}),250)):r?d||F(t,-5):3>j.length&&!r&&F(t),d){let t;j=j.slice(-3);let e=j[1].x-j[2].x,n=j[1].y-j[2].y;Math.hypot(e,n)>5?(e=j[0].x-j[2].x,n=j[0].y-j[2].y,t=[o[0]-5*e,o[1]-5*n]):t=o,p(q,o=U(t),o)}d=0,j=[]}},K,()=>{k(_).then((()=>{n(1,l=1),C()}))},b,v,x,w,W,s,()=>setTimeout(K,0)]}class Rt extends vt{constructor(t){super(),bt(this,t,Mt,Pt,c,{stuff:15,containerWidth:16,containerHeight:17,smallScreen:18},null,[-1,-1])}}function Yt(t){let e,n,o,i,r,l,c,u;return r=new Tt({props:{thumb:t[3],loaded:t[0]}}),{c(){e=E("div"),n=E("iframe"),i=A(),gt(r.$$.fragment),H(n,"allow","autoplay; fullscreen"),a(n.src,o=t[2])||H(n,"src",o),H(n,"title",t[4]),H(e,"class","bp-item bp-if"),O(e,"width",t[1][0]+"px"),O(e,"height",t[1][1]+"px")},m(o,s){I(o,e,s),x(e,n),x(e,i),$t(r,e,null),l=1,c||(u=[z(window,"resize",t[5]),z(n,"load",t[8])],c=1)},p(t,[n]){const o={};1&n&&(o.loaded=t[0]),r.$set(o),(!l||2&n)&&O(e,"width",t[1][0]+"px"),(!l||2&n)&&O(e,"height",t[1][1]+"px")},i(t){l||(ct(r.$$.fragment,t),l=1)},o(t){ut(r.$$.fragment,t),l=0},d(t){t&&k(e),yt(r),c=0,s(u)}}}function Wt(t,e,n){let o,i,{activeItem:r}=e,{calculateDimensions:s}=e,{iframe:l,thumb:c,title:u}=r;const a=()=>{n(1,i=s(r.width,r.height))};return a(),t.$$set=t=>{"activeItem"in t&&n(6,r=t.activeItem),"calculateDimensions"in t&&n(7,s=t.calculateDimensions)},[o,i,l,c,u,a,r,s,()=>n(0,o=1)]}class Lt extends vt{constructor(t){super(),bt(this,t,Wt,Yt,c,{activeItem:6,calculateDimensions:7})}}function jt(t,e,n){const o=t.slice();return o[11]=e[n],o}function Bt(t,e,n){const o=t.slice();return o[14]=e[n],o}function Xt(t){let e,n=[t[14]],i={};for(let t=0;n.length>t;t+=1)i=o(i,n[t]);return{c(){e=E("source"),N(e,i)},m(t,n){I(t,e,n)},p(t,o){N(e,i=ht(n,[4&o&&t[14]]))},d(t){t&&k(e)}}}function qt(t){let e,n=[t[11]],i={};for(let t=0;n.length>t;t+=1)i=o(i,n[t]);return{c(){e=E("track"),N(e,i)},m(t,n){I(t,e,n)},p(t,o){N(e,i=ht(n,[8&o&&t[11]]))},d(t){t&&k(e)}}}function Ut(t){let e,n,o,i,r,l,c,u,a=t[2],d=[];for(let e=0;a.length>e;e+=1)d[e]=Xt(Bt(t,a,e));let f=t[3],p=[];for(let e=0;f.length>e;e+=1)p[e]=qt(jt(t,f,e));return r=new Tt({props:{thumb:t[5],loaded:t[1]}}),{c(){e=E("div"),n=E("video");for(let t=0;d.length>t;t+=1)d[t].c();o=S();for(let t=0;p.length>t;t+=1)p[t].c();i=A(),gt(r.$$.fragment),n.playsInline=1,n.controls=1,n.autoplay=1,O(n,"width",t[4][0]+"px"),O(n,"height",t[4][1]+"px"),H(e,"class","bp-item bp-vid")},m(s,a){I(s,e,a),x(e,n);for(let t=0;d.length>t;t+=1)d[t].m(n,null);x(n,o);for(let t=0;p.length>t;t+=1)p[t].m(n,null);x(e,i),$t(r,e,null),l=1,c||(u=[z(window,"resize",t[9]),z(n,"canplay",t[10])],c=1)},p(t,[e]){if(4&e){let i;for(a=t[2],i=0;a.length>i;i+=1){const r=Bt(t,a,i);d[i]?d[i].p(r,e):(d[i]=Xt(r),d[i].c(),d[i].m(n,o))}for(;d.length>i;i+=1)d[i].d(1);d.length=a.length}if(8&e){let o;for(f=t[3],o=0;f.length>o;o+=1){const i=jt(t,f,o);p[o]?p[o].p(i,e):(p[o]=qt(i),p[o].c(),p[o].m(n,null))}for(;p.length>o;o+=1)p[o].d(1);p.length=f.length}(!l||16&e)&&O(n,"width",t[4][0]+"px"),(!l||16&e)&&O(n,"height",t[4][1]+"px");const i={};2&e&&(i.loaded=t[1]),r.$set(i)},i(t){l||(ct(r.$$.fragment,t),l=1)},o(t){ut(r.$$.fragment,t),l=0},d(t){t&&k(e),C(d,t),C(p,t),yt(r),c=0,s(u)}}}function Ft(t,e,n){let o,{activeItem:i}=e,{calculateDimensions:r}=e,{video:s,thumb:l,tracks:c=[],width:u,height:a}=i;s=Array.isArray(s)?s:s.split(", "),s=s.map((t=>({src:t,type:"video/"+t.match(/.(\w+)$/)[1]}))),c=Array.isArray(c)?c:JSON.parse(c);let d=r(u,a);return t.$$set=t=>{"activeItem"in t&&n(8,i=t.activeItem),"calculateDimensions"in t&&n(0,r=t.calculateDimensions)},[r,o,s,c,d,l,u,a,i,()=>n(4,d=r(u,a)),()=>n(1,o=1)]}class Jt extends vt{constructor(t){super(),bt(this,t,Ft,Ut,c,{activeItem:8,calculateDimensions:0})}}function Kt(t){let n,o;return{c(){n=new M,o=S(),n.a=o},m(e,i){n.m(t[0],e,i),I(e,o,i)},p:e,i:e,o:e,d(t){t&&k(o),t&&n.d()}}}function Gt(t,e,n){let{activeItem:o}=e,{html:i}=o;return t.$$set=t=>{"activeItem"in t&&n(1,o=t.activeItem)},[i,o]}class Qt extends vt{constructor(t){super(),bt(this,t,Gt,Kt,c,{activeItem:1})}}let Vt,Zt,{documentElement:te,body:ee}=document;const{window:ne}=mt;function oe(n){let o,i,r,l,c,u,a,f,p,h,g=n[7].i,$=ue(n),y=(!n[11]||!n[10])&&ae(n);return{c(){o=E("div"),i=E("div"),l=A(),$.c(),c=A(),y&&y.c(),H(o,"class","bp-wrap"),P(o,"zoomed",n[13]),P(o,"bp-inline",n[12])},m(e,r){var s;I(e,o,r),x(o,i),x(o,l),$.m(o,null),x(o,c),y&&y.m(o,null),n[26](o),f=1,p||(h=[m((s=o,t||(t=new ResizeObserver((t=>{for(const e of t)e.target.dispatchEvent(new CustomEvent("fd:resize"))}))),t.observe(s),u={destroy(){t.unobserve(s)}})),z(o,"fd:resize",n[25]),m(a=n[20].call(null,o))],p=1)},p(t,i){n=t,128&i[0]&&d(g,g=n[7].i)?(st(),ut($,1,1,e),lt(),$=ue(n),$.c(),ct($),$.m(o,c)):$.p(n,i),n[11]&&n[10]?y&&(st(),ut(y,1,1,(()=>{y=null})),lt()):y?(y.p(n,i),3072&i[0]&&ct(y,1)):(y=ae(n),y.c(),ct(y,1),y.m(o,null)),8192&i[0]&&P(o,"zoomed",n[13]),4096&i[0]&&P(o,"bp-inline",n[12])},i(t){f||(G((()=>{r||(r=pt(i,wt,{easing:xt,duration:480},1)),r.run(1)})),ct($),ct(y),f=1)},o(t){r||(r=pt(i,wt,{easing:xt,duration:480},0)),r.run(0),ut($),ut(y),f=0},d(t){t&&k(o),t&&r&&r.end(),$.d(t),y&&y.d(),n[26](null),p=0,s(h)}}}function ie(t){let e,n;return e=new Qt({props:{activeItem:t[7]}}),{c(){gt(e.$$.fragment)},m(t,o){$t(e,t,o),n=1},p(t,n){const o={};128&n[0]&&(o.activeItem=t[7]),e.$set(o)},i(t){n||(ct(e.$$.fragment,t),n=1)},o(t){ut(e.$$.fragment,t),n=0},d(t){yt(e,t)}}}function re(t){let e,n;return e=new Lt({props:{activeItem:t[7],calculateDimensions:t[15]}}),{c(){gt(e.$$.fragment)},m(t,o){$t(e,t,o),n=1},p(t,n){const o={};128&n[0]&&(o.activeItem=t[7]),e.$set(o)},i(t){n||(ct(e.$$.fragment,t),n=1)},o(t){ut(e.$$.fragment,t),n=0},d(t){yt(e,t)}}}function se(t){let e,n;return e=new Jt({props:{activeItem:t[7],calculateDimensions:t[15]}}),{c(){gt(e.$$.fragment)},m(t,o){$t(e,t,o),n=1},p(t,n){const o={};128&n[0]&&(o.activeItem=t[7]),e.$set(o)},i(t){n||(ct(e.$$.fragment,t),n=1)},o(t){ut(e.$$.fragment,t),n=0},d(t){yt(e,t)}}}function le(t){let e,n;return e=new Rt({props:{stuff:{activeItem:t[7],calculateDimensions:t[15],toggleControls:t[21],loadImage:t[16],preloadNext:t[17],next:t[4],prev:t[3],close:t[2],opts:t[5]},containerWidth:t[8],containerHeight:t[9],smallScreen:t[11]}}),{c(){gt(e.$$.fragment)},m(t,o){$t(e,t,o),n=1},p(t,n){const o={};160&n[0]&&(o.stuff={activeItem:t[7],calculateDimensions:t[15],toggleControls:t[21],loadImage:t[16],preloadNext:t[17],next:t[4],prev:t[3],close:t[2],opts:t[5]}),256&n[0]&&(o.containerWidth=t[8]),512&n[0]&&(o.containerHeight=t[9]),2048&n[0]&&(o.smallScreen=t[11]),e.$set(o)},i(t){n||(ct(e.$$.fragment,t),n=1)},o(t){ut(e.$$.fragment,t),n=0},d(t){yt(e,t)}}}function ce(t){let e,n,o,i=t[7].caption+"";return{c(){e=E("div"),H(e,"class","bp-cap")},m(t,n){I(t,e,n),e.innerHTML=i,o=1},p(t,n){(!o||128&n[0])&&i!==(i=t[7].caption+"")&&(e.innerHTML=i)},i(t){o||(G((()=>{n||(n=pt(e,wt,{duration:200},1)),n.run(1)})),o=1)},o(t){n||(n=pt(e,wt,{duration:200},0)),n.run(0),o=0},d(t){t&&k(e),t&&n&&n.end()}}}function ue(t){let e,n,o,i,r,s,l,c,u,a;const d=[le,se,re,ie],f=[];function p(t,e){return t[7].img?0:t[7].video?1:t[7].iframe?2:3}n=p(t),o=f[n]=d[n](t);let m=t[7].caption&&ce(t);return{c(){e=E("div"),o.c(),s=A(),m&&m.c(),l=S(),H(e,"class","bp-inner")},m(o,i){var r;I(o,e,i),f[n].m(e,null),I(o,s,i),m&&m.m(o,i),I(o,l,i),c=1,u||(a=z(e,"click",(r=t[2],function(t){t.target===this&&r.call(this,t)})),u=1)},p(t,i){let r=n;n=p(t),n===r?f[n].p(t,i):(st(),ut(f[r],1,1,(()=>{f[r]=null})),lt(),o=f[n],o?o.p(t,i):(o=f[n]=d[n](t),o.c()),ct(o,1),o.m(e,null)),t[7].caption?m?(m.p(t,i),128&i[0]&&ct(m,1)):(m=ce(t),m.c(),ct(m,1),m.m(l.parentNode,l)):m&&(st(),ut(m,1,1,(()=>{m=null})),lt())},i(n){c||(ct(o),G((()=>{r&&r.end(1),i=dt(e,t[18],{}),i.start()})),ct(m),c=1)},o(n){ut(o),i&&i.invalidate(),r=ft(e,t[19],{}),ut(m),c=0},d(t){t&&k(e),f[n].d(),t&&r&&r.end(),t&&k(s),m&&m.d(t),t&&k(l),u=0,a()}}}function ae(t){let e,n,o,i,r=!t[5].noClose&&de(t),s=t[0].length>1&&fe(t);return{c(){e=E("div"),r&&r.c(),n=A(),s&&s.c()},m(t,o){I(t,e,o),r&&r.m(e,null),x(e,n),s&&s.m(e,null),i=1},p(t,o){t[5].noClose?r&&(r.d(1),r=null):r?r.p(t,o):(r=de(t),r.c(),r.m(e,n)),t[0].length>1?s?s.p(t,o):(s=fe(t),s.c(),s.m(e,null)):s&&(s.d(1),s=null)},i(t){i||(G((()=>{o||(o=pt(e,wt,{duration:300},1)),o.run(1)})),i=1)},o(t){o||(o=pt(e,wt,{duration:300},0)),o.run(0),i=0},d(t){t&&k(e),r&&r.d(),s&&s.d(),t&&o&&o.end()}}}function de(t){let n,o,i;return{c(){n=E("button"),H(n,"class","bp-x"),H(n,"title","Close")},m(e,r){I(e,n,r),o||(i=z(n,"click",t[2]),o=1)},p:e,d(t){t&&k(n),o=0,i()}}}function fe(t){let e,n,o,i,r,l,c,u,a,d,f=t[1]+1+"",p=t[0].length+"";return{c(){e=E("div"),n=D(f),o=D(" / "),i=D(p),r=A(),l=E("button"),c=A(),u=E("button"),H(e,"class","bp-count"),H(l,"class","bp-next"),H(l,"title","Next"),H(u,"class","bp-prev"),H(u,"title","Previous")},m(s,f){I(s,e,f),x(e,n),x(e,o),x(e,i),I(s,r,f),I(s,l,f),I(s,c,f),I(s,u,f),a||(d=[z(l,"click",t[4]),z(u,"click",t[3])],a=1)},p(t,e){2&e[0]&&f!==(f=t[1]+1+"")&&T(n,f),1&e[0]&&p!==(p=t[0].length+"")&&T(i,p)},d(t){t&&k(e),t&&k(r),t&&k(l),t&&k(c),t&&k(u),a=0,s(d)}}}function pe(t){let e,n,o,i,r=t[0]&&oe(t);return{c(){r&&r.c(),e=S()},m(s,l){r&&r.m(s,l),I(s,e,l),n=1,o||(i=z(ne,"keydown",t[14]),o=1)},p(t,n){t[0]?r?(r.p(t,n),1&n[0]&&ct(r,1)):(r=oe(t),r.c(),ct(r,1),r.m(e.parentNode,e)):r&&(st(),ut(r,1,1,(()=>{r=null})),lt())},i(t){n||(ct(r),n=1)},o(t){ut(r),n=0},d(t){r&&r.d(t),t&&k(e),o=0,i()}}}function me(t,e,n){let o,i;f(t,Dt,(t=>n(30,o=t))),f(t,At,(t=>n(13,i=t)));let r,s,l,c,u,a,d,m,h,g,$,{items:y}=e,{position:b}=e,{target:v}=e;const x=()=>{r.noClose||(r.onClose&&r.onClose(),p(Dt,o=1,o),n(0,y=0),a&&a.focus({preventScroll:1}))},w=()=>I(b-1),_=()=>I(b+1),I=t=>{s=t-b,n(1,b=k(t))},k=t=>(t==y.length?t=0:0>t&&(t=y.length-1),t),C=t=>{const e=new Image;return e.src=t.img,t.preload=e,e.decode()},E=t=>{let{element:e}=$,n=t.firstElementChild,{clientWidth:o,clientHeight:i}=n,{top:r,left:s,width:l,height:a}=e.getBoundingClientRect(),d=s-(c-l)/2,f=r-(u-a)/2,p=e.clientWidth/o,m=e.clientHeight/i;return{duration:480,easing:xt,css(t){let e=1-t;return`transform:translate3d(${d*e}px, ${f*e}px, 0px) scale3d(${p+t*(1-p)}, ${m+t*(1-m)}, 1)`}}},D=()=>{n(11,h=769>c),r.onResize&&r.onResize($)};return t.$$set=t=>{"items"in t&&n(0,y=t.items),"position"in t&&n(1,b=t.position),"target"in t&&n(22,v=t.target)},t.$$.update=()=>{227&t.$$.dirty[0]&&y&&(n(7,$=y[b]),d&&r.onUpdate&&r.onUpdate(d,$))},[y,b,x,w,_,r,d,$,c,u,m,h,g,i,t=>{if(!l||g)return;let{keyCode:e}=t;if(27===e)x();else if(39==e)_();else if(37==e)w();else if(9===e){let e=Array.from(d.querySelectorAll("*")).filter((t=>t.tabIndex>=0));if(e.length){t.preventDefault();let n=e.indexOf(document.activeElement);n+=e.length+(t.shiftKey?-1:1),n%=e.length,e[n].focus()}}},(t,e,n)=>{let o,i;n=r.scale||.99;const s=(e=e||1080)/(t=t||1920);return s>u/c?(i=Math.min(e,u*n),o=i/s):(o=Math.min(t,c*n),i=o*s),[o,i]},C,()=>{let t=y[k(1)],e=y[k(-1)];t.img&&!t.preload&&C(t),e.img&&!e.preload&&C(e)},t=>l?_t(t,{x:s>0?20:-20,easing:xt,duration:300}):(l=1,r.onOpen&&r.onOpen(d),r.intro?_t(t,{y:10,easing:xt}):E(t)),t=>y?_t(t,{x:s>0?-20:20,easing:xt,duration:300}):r.intro?_t(t,{y:-10,easing:xt}):E(t),()=>(window.addEventListener("resize",D),{destroy(){window.removeEventListener("resize",D),p(Dt,o=l=0,o),te.style.overflowY=Vt,ee.style.overflowY=Vt,r.onClosed&&r.onClosed()}}),()=>n(10,m=!m),v,t=>{let e=t.items;a=document.activeElement,n(5,r=t),n(12,g=r.inline),g||te.scrollHeight>te.clientHeight&&(Vt=Vt||getComputedStyle(te).overflowY,Zt=Zt||getComputedStyle(ee).overflowY,te.style.overflowY="hidden",ee.style.overflowY="scroll"),n(8,c=v.offsetWidth),n(9,u=v==document.body?window.innerHeight:v.clientHeight),n(11,h=769>c),n(1,b=r.position||0),n(0,y=Array.isArray(e)?e.map(((t,e)=>({...t,i:e}))):[...e.length?e:[e]].reduce(((t,e,o)=>{let i={element:e,i:o};return e==r.el&&n(1,b=o),[...t,{...i,...e.dataset}]}),[]))},I,t=>{n(9,u=t.target.clientHeight),n(8,c=t.target.clientWidth)},t=>{q[t?"unshift":"push"]((()=>{d=t,n(6,d)}))}]}class he extends vt{constructor(t){super(),bt(this,t,me,pe,d,{items:0,position:1,target:22,open:23,close:2,prev:3,next:4,setPosition:24},null,[-1,-1])}get items(){return this.$$.ctx[0]}set items(t){this.$$set({items:t}),tt()}get position(){return this.$$.ctx[1]}set position(t){this.$$set({position:t}),tt()}get target(){return this.$$.ctx[22]}set target(t){this.$$set({target:t}),tt()}get open(){return this.$$.ctx[23]}get close(){return this.$$.ctx[2]}get prev(){return this.$$.ctx[3]}get next(){return this.$$.ctx[4]}get setPosition(){return this.$$.ctx[24]}}return t=>new he({...t,intro:1,props:t})}));
