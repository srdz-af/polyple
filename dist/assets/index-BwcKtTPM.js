var Nh=Object.defineProperty;var Fh=(i,e,t)=>e in i?Nh(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var lt=(i,e,t)=>Fh(i,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ga="160",Xi={ROTATE:0,DOLLY:1,PAN:2},Yi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Oh=0,ul=1,Bh=2,xu=1,zh=2,Wn=3,gi=0,Qt=1,Rn=2,di=0,gr=1,hl=2,dl=3,fl=4,Hh=5,Ci=100,Gh=101,Vh=102,pl=103,ml=104,kh=200,Wh=201,Xh=202,Yh=203,pa=204,ma=205,qh=206,jh=207,$h=208,Kh=209,Zh=210,Jh=211,Qh=212,ed=213,td=214,nd=0,id=1,rd=2,ks=3,sd=4,od=5,ad=6,ld=7,vu=0,cd=1,ud=2,fi=0,hd=1,dd=2,fd=3,Mu=4,pd=5,md=6,Su=300,Mr=301,Sr=302,ga=303,_a=304,ao=306,xa=1e3,Cn=1001,va=1002,Jt=1003,gl=1004,yo=1005,mn=1006,gd=1007,qr=1008,pi=1009,_d=1010,xd=1011,Va=1012,Eu=1013,oi=1014,ai=1015,jr=1016,yu=1017,bu=1018,Ii=1020,vd=1021,Pn=1023,Md=1024,Sd=1025,Ui=1026,Er=1027,Ed=1028,Tu=1029,yd=1030,Au=1031,wu=1033,bo=33776,To=33777,Ao=33778,wo=33779,_l=35840,xl=35841,vl=35842,Ml=35843,Ru=36196,Sl=37492,El=37496,yl=37808,bl=37809,Tl=37810,Al=37811,wl=37812,Rl=37813,Cl=37814,Pl=37815,Ll=37816,Dl=37817,Il=37818,Ul=37819,Nl=37820,Fl=37821,Ro=36492,Ol=36494,Bl=36495,bd=36283,zl=36284,Hl=36285,Gl=36286,Cu=3e3,Ni=3001,Td=3200,Ad=3201,Pu=0,wd=1,xn="",Lt="srgb",$n="srgb-linear",ka="display-p3",lo="display-p3-linear",Ws="linear",dt="srgb",Xs="rec709",Ys="p3",qi=7680,Vl=519,Rd=512,Cd=513,Pd=514,Lu=515,Ld=516,Dd=517,Id=518,Ud=519,kl=35044,Wl="300 es",Ma=1035,qn=2e3,qs=2001;class Vi{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const r=this._listeners[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const n=this._listeners[e.type];if(n!==void 0){e.target=this;const r=n.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const kt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Os=Math.PI/180,Sa=180/Math.PI;function Jr(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(kt[i&255]+kt[i>>8&255]+kt[i>>16&255]+kt[i>>24&255]+"-"+kt[e&255]+kt[e>>8&255]+"-"+kt[e>>16&15|64]+kt[e>>24&255]+"-"+kt[t&63|128]+kt[t>>8&255]+"-"+kt[t>>16&255]+kt[t>>24&255]+kt[n&255]+kt[n>>8&255]+kt[n>>16&255]+kt[n>>24&255]).toLowerCase()}function Yt(i,e,t){return Math.max(e,Math.min(t,i))}function Nd(i,e){return(i%e+e)%e}function Co(i,e,t){return(1-t)*i+t*e}function Xl(i){return(i&i-1)===0&&i!==0}function Ea(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Dr(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function en(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const Fd={DEG2RAD:Os};class Ne{constructor(e=0,t=0){Ne.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Yt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*n-a*r+e.x,this.y=s*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ke{constructor(e,t,n,r,s,a,o,l,c){Ke.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,l,c)}set(e,t,n,r,s,a,o,l,c){const u=this.elements;return u[0]=e,u[1]=r,u[2]=o,u[3]=t,u[4]=s,u[5]=l,u[6]=n,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],u=n[4],h=n[7],d=n[2],m=n[5],g=n[8],_=r[0],p=r[3],f=r[6],y=r[1],x=r[4],b=r[7],L=r[2],P=r[5],R=r[8];return s[0]=a*_+o*y+l*L,s[3]=a*p+o*x+l*P,s[6]=a*f+o*b+l*R,s[1]=c*_+u*y+h*L,s[4]=c*p+u*x+h*P,s[7]=c*f+u*b+h*R,s[2]=d*_+m*y+g*L,s[5]=d*p+m*x+g*P,s[8]=d*f+m*b+g*R,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8];return t*a*u-t*o*c-n*s*u+n*o*l+r*s*c-r*a*l}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],h=u*a-o*c,d=o*l-u*s,m=c*s-a*l,g=t*h+n*d+r*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return e[0]=h*_,e[1]=(r*c-u*n)*_,e[2]=(o*n-r*a)*_,e[3]=d*_,e[4]=(u*t-r*l)*_,e[5]=(r*s-o*t)*_,e[6]=m*_,e[7]=(n*l-c*t)*_,e[8]=(a*t-n*s)*_,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Po.makeScale(e,t)),this}rotate(e){return this.premultiply(Po.makeRotation(-e)),this}translate(e,t){return this.premultiply(Po.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<9;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Po=new Ke;function Du(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function js(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Od(){const i=js("canvas");return i.style.display="block",i}const Yl={};function Vr(i){i in Yl||(Yl[i]=!0,console.warn(i))}const ql=new Ke().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),jl=new Ke().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),os={[$n]:{transfer:Ws,primaries:Xs,toReference:i=>i,fromReference:i=>i},[Lt]:{transfer:dt,primaries:Xs,toReference:i=>i.convertSRGBToLinear(),fromReference:i=>i.convertLinearToSRGB()},[lo]:{transfer:Ws,primaries:Ys,toReference:i=>i.applyMatrix3(jl),fromReference:i=>i.applyMatrix3(ql)},[ka]:{transfer:dt,primaries:Ys,toReference:i=>i.convertSRGBToLinear().applyMatrix3(jl),fromReference:i=>i.applyMatrix3(ql).convertLinearToSRGB()}},Bd=new Set([$n,lo]),st={enabled:!0,_workingColorSpace:$n,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(i){if(!Bd.has(i))throw new Error(`Unsupported working color space, "${i}".`);this._workingColorSpace=i},convert:function(i,e,t){if(this.enabled===!1||e===t||!e||!t)return i;const n=os[e].toReference,r=os[t].fromReference;return r(n(i))},fromWorkingColorSpace:function(i,e){return this.convert(i,this._workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this._workingColorSpace)},getPrimaries:function(i){return os[i].primaries},getTransfer:function(i){return i===xn?Ws:os[i].transfer}};function _r(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Lo(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let ji;class Iu{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{ji===void 0&&(ji=js("canvas")),ji.width=e.width,ji.height=e.height;const n=ji.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=ji}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=js("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const r=n.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=_r(s[a]/255)*255;return n.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(_r(t[n]/255)*255):t[n]=_r(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let zd=0;class Uu{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:zd++}),this.uuid=Jr(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(Do(r[a].image)):s.push(Do(r[a]))}else s=Do(r);n.url=s}return t||(e.images[this.uuid]=n),n}}function Do(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Iu.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Hd=0;class un extends Vi{constructor(e=un.DEFAULT_IMAGE,t=un.DEFAULT_MAPPING,n=Cn,r=Cn,s=mn,a=qr,o=Pn,l=pi,c=un.DEFAULT_ANISOTROPY,u=xn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Hd++}),this.uuid=Jr(),this.name="",this.source=new Uu(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Ne(0,0),this.repeat=new Ne(1,1),this.center=new Ne(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ke,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof u=="string"?this.colorSpace=u:(Vr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=u===Ni?Lt:xn),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Su)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case xa:e.x=e.x-Math.floor(e.x);break;case Cn:e.x=e.x<0?0:1;break;case va:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case xa:e.y=e.y-Math.floor(e.y);break;case Cn:e.y=e.y<0?0:1;break;case va:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return Vr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===Lt?Ni:Cu}set encoding(e){Vr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===Ni?Lt:xn}}un.DEFAULT_IMAGE=null;un.DEFAULT_MAPPING=Su;un.DEFAULT_ANISOTROPY=1;class gt{constructor(e=0,t=0,n=0,r=1){gt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*s,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,s;const l=e.elements,c=l[0],u=l[4],h=l[8],d=l[1],m=l[5],g=l[9],_=l[2],p=l[6],f=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-_)<.01&&Math.abs(g-p)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+_)<.1&&Math.abs(g+p)<.1&&Math.abs(c+m+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const x=(c+1)/2,b=(m+1)/2,L=(f+1)/2,P=(u+d)/4,R=(h+_)/4,K=(g+p)/4;return x>b&&x>L?x<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(x),r=P/n,s=R/n):b>L?b<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(b),n=P/r,s=K/r):L<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(L),n=R/s,r=K/s),this.set(n,r,s,t),this}let y=Math.sqrt((p-g)*(p-g)+(h-_)*(h-_)+(d-u)*(d-u));return Math.abs(y)<.001&&(y=1),this.x=(p-g)/y,this.y=(h-_)/y,this.z=(d-u)/y,this.w=Math.acos((c+m+f-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Gd extends Vi{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new gt(0,0,e,t),this.scissorTest=!1,this.viewport=new gt(0,0,e,t);const r={width:e,height:t,depth:1};n.encoding!==void 0&&(Vr("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),n.colorSpace=n.encoding===Ni?Lt:xn),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:mn,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},n),this.texture=new un(r,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=n.generateMipmaps,this.texture.internalFormat=n.internalFormat,this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}setSize(e,t,n=1){(this.width!==e||this.height!==t||this.depth!==n)&&(this.width=e,this.height=t,this.depth=n,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=n,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new Uu(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Fi extends Gd{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class Nu extends un{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Jt,this.minFilter=Jt,this.wrapR=Cn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Vd extends un{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Jt,this.minFilter=Jt,this.wrapR=Cn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class On{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,s,a,o){let l=n[r+0],c=n[r+1],u=n[r+2],h=n[r+3];const d=s[a+0],m=s[a+1],g=s[a+2],_=s[a+3];if(o===0){e[t+0]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h;return}if(o===1){e[t+0]=d,e[t+1]=m,e[t+2]=g,e[t+3]=_;return}if(h!==_||l!==d||c!==m||u!==g){let p=1-o;const f=l*d+c*m+u*g+h*_,y=f>=0?1:-1,x=1-f*f;if(x>Number.EPSILON){const L=Math.sqrt(x),P=Math.atan2(L,f*y);p=Math.sin(p*P)/L,o=Math.sin(o*P)/L}const b=o*y;if(l=l*p+d*b,c=c*p+m*b,u=u*p+g*b,h=h*p+_*b,p===1-o){const L=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=L,c*=L,u*=L,h*=L}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,r,s,a){const o=n[r],l=n[r+1],c=n[r+2],u=n[r+3],h=s[a],d=s[a+1],m=s[a+2],g=s[a+3];return e[t]=o*g+u*h+l*m-c*d,e[t+1]=l*g+u*d+c*h-o*m,e[t+2]=c*g+u*m+o*d-l*h,e[t+3]=u*g-o*h-l*d-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(r/2),h=o(s/2),d=l(n/2),m=l(r/2),g=l(s/2);switch(a){case"XYZ":this._x=d*u*h+c*m*g,this._y=c*m*h-d*u*g,this._z=c*u*g+d*m*h,this._w=c*u*h-d*m*g;break;case"YXZ":this._x=d*u*h+c*m*g,this._y=c*m*h-d*u*g,this._z=c*u*g-d*m*h,this._w=c*u*h+d*m*g;break;case"ZXY":this._x=d*u*h-c*m*g,this._y=c*m*h+d*u*g,this._z=c*u*g+d*m*h,this._w=c*u*h-d*m*g;break;case"ZYX":this._x=d*u*h-c*m*g,this._y=c*m*h+d*u*g,this._z=c*u*g-d*m*h,this._w=c*u*h+d*m*g;break;case"YZX":this._x=d*u*h+c*m*g,this._y=c*m*h+d*u*g,this._z=c*u*g-d*m*h,this._w=c*u*h-d*m*g;break;case"XZY":this._x=d*u*h-c*m*g,this._y=c*m*h-d*u*g,this._z=c*u*g+d*m*h,this._w=c*u*h+d*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],u=t[6],h=t[10],d=n+o+h;if(d>0){const m=.5/Math.sqrt(d+1);this._w=.25/m,this._x=(u-l)*m,this._y=(s-c)*m,this._z=(a-r)*m}else if(n>o&&n>h){const m=2*Math.sqrt(1+n-o-h);this._w=(u-l)/m,this._x=.25*m,this._y=(r+a)/m,this._z=(s+c)/m}else if(o>h){const m=2*Math.sqrt(1+o-n-h);this._w=(s-c)/m,this._x=(r+a)/m,this._y=.25*m,this._z=(l+u)/m}else{const m=2*Math.sqrt(1+h-n-o);this._w=(a-r)/m,this._x=(s+c)/m,this._y=(l+u)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Yt(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,u=t._w;return this._x=n*u+a*o+r*c-s*l,this._y=r*u+a*l+s*o-n*c,this._z=s*u+a*c+n*l-r*o,this._w=a*u-n*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,r=this._y,s=this._z,a=this._w;let o=a*e._w+n*e._x+r*e._y+s*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=r,this._z=s,this;const l=1-o*o;if(l<=Number.EPSILON){const m=1-t;return this._w=m*a+t*this._w,this._x=m*n+t*this._x,this._y=m*r+t*this._y,this._z=m*s+t*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,o),h=Math.sin((1-t)*u)/c,d=Math.sin(t*u)/c;return this._w=a*h+this._w*d,this._x=n*h+this._x*d,this._y=r*h+this._y*d,this._z=s*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=Math.random(),t=Math.sqrt(1-e),n=Math.sqrt(e),r=2*Math.PI*Math.random(),s=2*Math.PI*Math.random();return this.set(t*Math.cos(r),n*Math.sin(s),n*Math.cos(s),t*Math.sin(r))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class w{constructor(e=0,t=0,n=0){w.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion($l.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion($l.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*r,this.y=s[1]*t+s[4]*n+s[7]*r,this.z=s[2]*t+s[5]*n+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*n+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*n+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*n),u=2*(o*t-s*r),h=2*(s*n-a*t);return this.x=t+l*c+a*h-o*u,this.y=n+l*u+o*c-s*h,this.z=r+l*h+s*u-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*r,this.y=s[1]*t+s[5]*n+s[9]*r,this.z=s[2]*t+s[6]*n+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-n*l,this.z=n*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Io.copy(this).projectOnVector(e),this.sub(Io)}reflect(e){return this.sub(Io.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Yt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,n=Math.sqrt(1-e**2);return this.x=n*Math.cos(t),this.y=n*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Io=new w,$l=new On;class ki{constructor(e=new w(1/0,1/0,1/0),t=new w(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Sn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Sn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Sn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const s=n.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Sn):Sn.fromBufferAttribute(s,a),Sn.applyMatrix4(e.matrixWorld),this.expandByPoint(Sn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),as.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),as.copy(n.boundingBox)),as.applyMatrix4(e.matrixWorld),this.union(as)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,Sn),Sn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ir),ls.subVectors(this.max,Ir),$i.subVectors(e.a,Ir),Ki.subVectors(e.b,Ir),Zi.subVectors(e.c,Ir),Zn.subVectors(Ki,$i),Jn.subVectors(Zi,Ki),yi.subVectors($i,Zi);let t=[0,-Zn.z,Zn.y,0,-Jn.z,Jn.y,0,-yi.z,yi.y,Zn.z,0,-Zn.x,Jn.z,0,-Jn.x,yi.z,0,-yi.x,-Zn.y,Zn.x,0,-Jn.y,Jn.x,0,-yi.y,yi.x,0];return!Uo(t,$i,Ki,Zi,ls)||(t=[1,0,0,0,1,0,0,0,1],!Uo(t,$i,Ki,Zi,ls))?!1:(cs.crossVectors(Zn,Jn),t=[cs.x,cs.y,cs.z],Uo(t,$i,Ki,Zi,ls))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Sn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Sn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(zn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),zn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),zn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),zn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),zn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),zn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),zn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),zn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(zn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const zn=[new w,new w,new w,new w,new w,new w,new w,new w],Sn=new w,as=new ki,$i=new w,Ki=new w,Zi=new w,Zn=new w,Jn=new w,yi=new w,Ir=new w,ls=new w,cs=new w,bi=new w;function Uo(i,e,t,n,r){for(let s=0,a=i.length-3;s<=a;s+=3){bi.fromArray(i,s);const o=r.x*Math.abs(bi.x)+r.y*Math.abs(bi.y)+r.z*Math.abs(bi.z),l=e.dot(bi),c=t.dot(bi),u=n.dot(bi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}const kd=new ki,Ur=new w,No=new w;class Rr{constructor(e=new w,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):kd.setFromPoints(e).getCenter(n);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,n.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Ur.subVectors(e,this.center);const t=Ur.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),r=(n-this.radius)*.5;this.center.addScaledVector(Ur,r/n),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(No.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Ur.copy(e.center).add(No)),this.expandByPoint(Ur.copy(e.center).sub(No))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Hn=new w,Fo=new w,us=new w,Qn=new w,Oo=new w,hs=new w,Bo=new w;class co{constructor(e=new w,t=new w(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Hn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Hn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Hn.copy(this.origin).addScaledVector(this.direction,t),Hn.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Fo.copy(e).add(t).multiplyScalar(.5),us.copy(t).sub(e).normalize(),Qn.copy(this.origin).sub(Fo);const s=e.distanceTo(t)*.5,a=-this.direction.dot(us),o=Qn.dot(this.direction),l=-Qn.dot(us),c=Qn.lengthSq(),u=Math.abs(1-a*a);let h,d,m,g;if(u>0)if(h=a*l-o,d=a*o-l,g=s*u,h>=0)if(d>=-g)if(d<=g){const _=1/u;h*=_,d*=_,m=h*(h+a*d+2*o)+d*(a*h+d+2*l)+c}else d=s,h=Math.max(0,-(a*d+o)),m=-h*h+d*(d+2*l)+c;else d=-s,h=Math.max(0,-(a*d+o)),m=-h*h+d*(d+2*l)+c;else d<=-g?(h=Math.max(0,-(-a*s+o)),d=h>0?-s:Math.min(Math.max(-s,-l),s),m=-h*h+d*(d+2*l)+c):d<=g?(h=0,d=Math.min(Math.max(-s,-l),s),m=d*(d+2*l)+c):(h=Math.max(0,-(a*s+o)),d=h>0?s:Math.min(Math.max(-s,-l),s),m=-h*h+d*(d+2*l)+c);else d=a>0?-s:s,h=Math.max(0,-(a*d+o)),m=-h*h+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,h),r&&r.copy(Fo).addScaledVector(us,d),m}intersectSphere(e,t){Hn.subVectors(e.center,this.origin);const n=Hn.dot(this.direction),r=Hn.dot(Hn)-n*n,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,s,a,o,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),u>=0?(s=(e.min.y-d.y)*u,a=(e.max.y-d.y)*u):(s=(e.max.y-d.y)*u,a=(e.min.y-d.y)*u),n>a||s>r||((s>n||isNaN(n))&&(n=s),(a<r||isNaN(r))&&(r=a),h>=0?(o=(e.min.z-d.z)*h,l=(e.max.z-d.z)*h):(o=(e.max.z-d.z)*h,l=(e.min.z-d.z)*h),n>l||o>r)||((o>n||n!==n)&&(n=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Hn)!==null}intersectTriangle(e,t,n,r,s){Oo.subVectors(t,e),hs.subVectors(n,e),Bo.crossVectors(Oo,hs);let a=this.direction.dot(Bo),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Qn.subVectors(this.origin,e);const l=o*this.direction.dot(hs.crossVectors(Qn,hs));if(l<0)return null;const c=o*this.direction.dot(Oo.cross(Qn));if(c<0||l+c>a)return null;const u=-o*Qn.dot(Bo);return u<0?null:this.at(u/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class at{constructor(e,t,n,r,s,a,o,l,c,u,h,d,m,g,_,p){at.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,l,c,u,h,d,m,g,_,p)}set(e,t,n,r,s,a,o,l,c,u,h,d,m,g,_,p){const f=this.elements;return f[0]=e,f[4]=t,f[8]=n,f[12]=r,f[1]=s,f[5]=a,f[9]=o,f[13]=l,f[2]=c,f[6]=u,f[10]=h,f[14]=d,f[3]=m,f[7]=g,f[11]=_,f[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new at().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,r=1/Ji.setFromMatrixColumn(e,0).length(),s=1/Ji.setFromMatrixColumn(e,1).length(),a=1/Ji.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,r=e.y,s=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(r),c=Math.sin(r),u=Math.cos(s),h=Math.sin(s);if(e.order==="XYZ"){const d=a*u,m=a*h,g=o*u,_=o*h;t[0]=l*u,t[4]=-l*h,t[8]=c,t[1]=m+g*c,t[5]=d-_*c,t[9]=-o*l,t[2]=_-d*c,t[6]=g+m*c,t[10]=a*l}else if(e.order==="YXZ"){const d=l*u,m=l*h,g=c*u,_=c*h;t[0]=d+_*o,t[4]=g*o-m,t[8]=a*c,t[1]=a*h,t[5]=a*u,t[9]=-o,t[2]=m*o-g,t[6]=_+d*o,t[10]=a*l}else if(e.order==="ZXY"){const d=l*u,m=l*h,g=c*u,_=c*h;t[0]=d-_*o,t[4]=-a*h,t[8]=g+m*o,t[1]=m+g*o,t[5]=a*u,t[9]=_-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const d=a*u,m=a*h,g=o*u,_=o*h;t[0]=l*u,t[4]=g*c-m,t[8]=d*c+_,t[1]=l*h,t[5]=_*c+d,t[9]=m*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const d=a*l,m=a*c,g=o*l,_=o*c;t[0]=l*u,t[4]=_-d*h,t[8]=g*h+m,t[1]=h,t[5]=a*u,t[9]=-o*u,t[2]=-c*u,t[6]=m*h+g,t[10]=d-_*h}else if(e.order==="XZY"){const d=a*l,m=a*c,g=o*l,_=o*c;t[0]=l*u,t[4]=-h,t[8]=c*u,t[1]=d*h+_,t[5]=a*u,t[9]=m*h-g,t[2]=g*h-m,t[6]=o*u,t[10]=_*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Wd,e,Xd)}lookAt(e,t,n){const r=this.elements;return ln.subVectors(e,t),ln.lengthSq()===0&&(ln.z=1),ln.normalize(),ei.crossVectors(n,ln),ei.lengthSq()===0&&(Math.abs(n.z)===1?ln.x+=1e-4:ln.z+=1e-4,ln.normalize(),ei.crossVectors(n,ln)),ei.normalize(),ds.crossVectors(ln,ei),r[0]=ei.x,r[4]=ds.x,r[8]=ln.x,r[1]=ei.y,r[5]=ds.y,r[9]=ln.y,r[2]=ei.z,r[6]=ds.z,r[10]=ln.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],u=n[1],h=n[5],d=n[9],m=n[13],g=n[2],_=n[6],p=n[10],f=n[14],y=n[3],x=n[7],b=n[11],L=n[15],P=r[0],R=r[4],K=r[8],S=r[12],A=r[1],k=r[5],X=r[9],oe=r[13],D=r[2],z=r[6],V=r[10],j=r[14],Y=r[3],q=r[7],$=r[11],se=r[15];return s[0]=a*P+o*A+l*D+c*Y,s[4]=a*R+o*k+l*z+c*q,s[8]=a*K+o*X+l*V+c*$,s[12]=a*S+o*oe+l*j+c*se,s[1]=u*P+h*A+d*D+m*Y,s[5]=u*R+h*k+d*z+m*q,s[9]=u*K+h*X+d*V+m*$,s[13]=u*S+h*oe+d*j+m*se,s[2]=g*P+_*A+p*D+f*Y,s[6]=g*R+_*k+p*z+f*q,s[10]=g*K+_*X+p*V+f*$,s[14]=g*S+_*oe+p*j+f*se,s[3]=y*P+x*A+b*D+L*Y,s[7]=y*R+x*k+b*z+L*q,s[11]=y*K+x*X+b*V+L*$,s[15]=y*S+x*oe+b*j+L*se,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],u=e[2],h=e[6],d=e[10],m=e[14],g=e[3],_=e[7],p=e[11],f=e[15];return g*(+s*l*h-r*c*h-s*o*d+n*c*d+r*o*m-n*l*m)+_*(+t*l*m-t*c*d+s*a*d-r*a*m+r*c*u-s*l*u)+p*(+t*c*h-t*o*m-s*a*h+n*a*m+s*o*u-n*c*u)+f*(-r*o*u-t*l*h+t*o*d+r*a*h-n*a*d+n*l*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],h=e[9],d=e[10],m=e[11],g=e[12],_=e[13],p=e[14],f=e[15],y=h*p*c-_*d*c+_*l*m-o*p*m-h*l*f+o*d*f,x=g*d*c-u*p*c-g*l*m+a*p*m+u*l*f-a*d*f,b=u*_*c-g*h*c+g*o*m-a*_*m-u*o*f+a*h*f,L=g*h*l-u*_*l-g*o*d+a*_*d+u*o*p-a*h*p,P=t*y+n*x+r*b+s*L;if(P===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const R=1/P;return e[0]=y*R,e[1]=(_*d*s-h*p*s-_*r*m+n*p*m+h*r*f-n*d*f)*R,e[2]=(o*p*s-_*l*s+_*r*c-n*p*c-o*r*f+n*l*f)*R,e[3]=(h*l*s-o*d*s-h*r*c+n*d*c+o*r*m-n*l*m)*R,e[4]=x*R,e[5]=(u*p*s-g*d*s+g*r*m-t*p*m-u*r*f+t*d*f)*R,e[6]=(g*l*s-a*p*s-g*r*c+t*p*c+a*r*f-t*l*f)*R,e[7]=(a*d*s-u*l*s+u*r*c-t*d*c-a*r*m+t*l*m)*R,e[8]=b*R,e[9]=(g*h*s-u*_*s-g*n*m+t*_*m+u*n*f-t*h*f)*R,e[10]=(a*_*s-g*o*s+g*n*c-t*_*c-a*n*f+t*o*f)*R,e[11]=(u*o*s-a*h*s-u*n*c+t*h*c+a*n*m-t*o*m)*R,e[12]=L*R,e[13]=(u*_*r-g*h*r+g*n*d-t*_*d-u*n*p+t*h*p)*R,e[14]=(g*o*r-a*_*r-g*n*l+t*_*l+a*n*p-t*o*p)*R,e[15]=(a*h*r-u*o*r+u*n*l-t*h*l-a*n*d+t*o*d)*R,this}scale(e){const t=this.elements,n=e.x,r=e.y,s=e.z;return t[0]*=n,t[4]*=r,t[8]*=s,t[1]*=n,t[5]*=r,t[9]*=s,t[2]*=n,t[6]*=r,t[10]*=s,t[3]*=n,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),r=Math.sin(t),s=1-n,a=e.x,o=e.y,l=e.z,c=s*a,u=s*o;return this.set(c*a+n,c*o-r*l,c*l+r*o,0,c*o+r*l,u*o+n,u*l-r*a,0,c*l-r*o,u*l+r*a,s*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,s,a){return this.set(1,n,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){const r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,u=a+a,h=o+o,d=s*c,m=s*u,g=s*h,_=a*u,p=a*h,f=o*h,y=l*c,x=l*u,b=l*h,L=n.x,P=n.y,R=n.z;return r[0]=(1-(_+f))*L,r[1]=(m+b)*L,r[2]=(g-x)*L,r[3]=0,r[4]=(m-b)*P,r[5]=(1-(d+f))*P,r[6]=(p+y)*P,r[7]=0,r[8]=(g+x)*R,r[9]=(p-y)*R,r[10]=(1-(d+_))*R,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){const r=this.elements;let s=Ji.set(r[0],r[1],r[2]).length();const a=Ji.set(r[4],r[5],r[6]).length(),o=Ji.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),e.x=r[12],e.y=r[13],e.z=r[14],En.copy(this);const c=1/s,u=1/a,h=1/o;return En.elements[0]*=c,En.elements[1]*=c,En.elements[2]*=c,En.elements[4]*=u,En.elements[5]*=u,En.elements[6]*=u,En.elements[8]*=h,En.elements[9]*=h,En.elements[10]*=h,t.setFromRotationMatrix(En),n.x=s,n.y=a,n.z=o,this}makePerspective(e,t,n,r,s,a,o=qn){const l=this.elements,c=2*s/(t-e),u=2*s/(n-r),h=(t+e)/(t-e),d=(n+r)/(n-r);let m,g;if(o===qn)m=-(a+s)/(a-s),g=-2*a*s/(a-s);else if(o===qs)m=-a/(a-s),g=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=u,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,r,s,a,o=qn){const l=this.elements,c=1/(t-e),u=1/(n-r),h=1/(a-s),d=(t+e)*c,m=(n+r)*u;let g,_;if(o===qn)g=(a+s)*h,_=-2*h;else if(o===qs)g=s*h,_=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=_,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<16;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const Ji=new w,En=new at,Wd=new w(0,0,0),Xd=new w(1,1,1),ei=new w,ds=new w,ln=new w,Kl=new at,Zl=new On;class Un{constructor(e=0,t=0,n=0,r=Un.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],u=r[9],h=r[2],d=r[6],m=r[10];switch(t){case"XYZ":this._y=Math.asin(Yt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,m),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Yt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,s),this._z=0);break;case"ZXY":this._x=Math.asin(Yt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,m),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Yt(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,m),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Yt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,s)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-Yt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-u,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Kl.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Kl,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Zl.setFromEuler(this),this.setFromQuaternion(Zl,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Un.DEFAULT_ORDER="XYZ";class Wa{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Yd=0;const Jl=new w,Qi=new On,Gn=new at,fs=new w,Nr=new w,qd=new w,jd=new On,Ql=new w(1,0,0),ec=new w(0,1,0),tc=new w(0,0,1),$d={type:"added"},Kd={type:"removed"};class Dt extends Vi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Yd++}),this.uuid=Jr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Dt.DEFAULT_UP.clone();const e=new w,t=new Un,n=new On,r=new w(1,1,1);function s(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new at},normalMatrix:{value:new Ke}}),this.matrix=new at,this.matrixWorld=new at,this.matrixAutoUpdate=Dt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Dt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Wa,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Qi.setFromAxisAngle(e,t),this.quaternion.multiply(Qi),this}rotateOnWorldAxis(e,t){return Qi.setFromAxisAngle(e,t),this.quaternion.premultiply(Qi),this}rotateX(e){return this.rotateOnAxis(Ql,e)}rotateY(e){return this.rotateOnAxis(ec,e)}rotateZ(e){return this.rotateOnAxis(tc,e)}translateOnAxis(e,t){return Jl.copy(e).applyQuaternion(this.quaternion),this.position.add(Jl.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ql,e)}translateY(e){return this.translateOnAxis(ec,e)}translateZ(e){return this.translateOnAxis(tc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Gn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?fs.copy(e):fs.set(e,t,n);const r=this.parent;this.updateWorldMatrix(!0,!1),Nr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Gn.lookAt(Nr,fs,this.up):Gn.lookAt(fs,Nr,this.up),this.quaternion.setFromRotationMatrix(Gn),r&&(Gn.extractRotation(r.matrixWorld),Qi.setFromRotationMatrix(Gn),this.quaternion.premultiply(Qi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent($d)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Kd)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Gn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Gn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Gn),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Nr,e,qd),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Nr,jd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,r=t.length;n<r;n++){const s=t[n];(s.matrixWorldAutoUpdate===!0||e===!0)&&s.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const r=this.children;for(let s=0,a=r.length;s<a;s++){const o=r[s];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),r.maxGeometryCount=this._maxGeometryCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];s(e.shapes,h)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),u=a(e.images),h=a(e.shapes),d=a(e.skeletons),m=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=r,n;function a(o){const l=[];for(const c in o){const u=o[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const r=e.children[n];this.add(r.clone())}return this}}Dt.DEFAULT_UP=new w(0,1,0);Dt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Dt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const yn=new w,Vn=new w,zo=new w,kn=new w,er=new w,tr=new w,nc=new w,Ho=new w,Go=new w,Vo=new w;let ps=!1;class gn{constructor(e=new w,t=new w,n=new w){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),yn.subVectors(e,t),r.cross(yn);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,n,r,s){yn.subVectors(r,t),Vn.subVectors(n,t),zo.subVectors(e,t);const a=yn.dot(yn),o=yn.dot(Vn),l=yn.dot(zo),c=Vn.dot(Vn),u=Vn.dot(zo),h=a*c-o*o;if(h===0)return s.set(0,0,0),null;const d=1/h,m=(c*l-o*u)*d,g=(a*u-o*l)*d;return s.set(1-m-g,g,m)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,kn)===null?!1:kn.x>=0&&kn.y>=0&&kn.x+kn.y<=1}static getUV(e,t,n,r,s,a,o,l){return ps===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),ps=!0),this.getInterpolation(e,t,n,r,s,a,o,l)}static getInterpolation(e,t,n,r,s,a,o,l){return this.getBarycoord(e,t,n,r,kn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,kn.x),l.addScaledVector(a,kn.y),l.addScaledVector(o,kn.z),l)}static isFrontFacing(e,t,n,r){return yn.subVectors(n,t),Vn.subVectors(e,t),yn.cross(Vn).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return yn.subVectors(this.c,this.b),Vn.subVectors(this.a,this.b),yn.cross(Vn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return gn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return gn.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,n,r,s){return ps===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),ps=!0),gn.getInterpolation(e,this.a,this.b,this.c,t,n,r,s)}getInterpolation(e,t,n,r,s){return gn.getInterpolation(e,this.a,this.b,this.c,t,n,r,s)}containsPoint(e){return gn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return gn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,r=this.b,s=this.c;let a,o;er.subVectors(r,n),tr.subVectors(s,n),Ho.subVectors(e,n);const l=er.dot(Ho),c=tr.dot(Ho);if(l<=0&&c<=0)return t.copy(n);Go.subVectors(e,r);const u=er.dot(Go),h=tr.dot(Go);if(u>=0&&h<=u)return t.copy(r);const d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return a=l/(l-u),t.copy(n).addScaledVector(er,a);Vo.subVectors(e,s);const m=er.dot(Vo),g=tr.dot(Vo);if(g>=0&&m<=g)return t.copy(s);const _=m*c-l*g;if(_<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(n).addScaledVector(tr,o);const p=u*g-m*h;if(p<=0&&h-u>=0&&m-g>=0)return nc.subVectors(s,r),o=(h-u)/(h-u+(m-g)),t.copy(r).addScaledVector(nc,o);const f=1/(p+_+d);return a=_*f,o=d*f,t.copy(n).addScaledVector(er,a).addScaledVector(tr,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Fu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ti={h:0,s:0,l:0},ms={h:0,s:0,l:0};function ko(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class je{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Lt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,st.toWorkingColorSpace(this,t),this}setRGB(e,t,n,r=st.workingColorSpace){return this.r=e,this.g=t,this.b=n,st.toWorkingColorSpace(this,r),this}setHSL(e,t,n,r=st.workingColorSpace){if(e=Nd(e,1),t=Yt(t,0,1),n=Yt(n,0,1),t===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+t):n+t-n*t,a=2*n-s;this.r=ko(a,s,e+1/3),this.g=ko(a,s,e),this.b=ko(a,s,e-1/3)}return st.toWorkingColorSpace(this,r),this}setStyle(e,t=Lt){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Lt){const n=Fu[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=_r(e.r),this.g=_r(e.g),this.b=_r(e.b),this}copyLinearToSRGB(e){return this.r=Lo(e.r),this.g=Lo(e.g),this.b=Lo(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Lt){return st.fromWorkingColorSpace(Wt.copy(this),e),Math.round(Yt(Wt.r*255,0,255))*65536+Math.round(Yt(Wt.g*255,0,255))*256+Math.round(Yt(Wt.b*255,0,255))}getHexString(e=Lt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=st.workingColorSpace){st.fromWorkingColorSpace(Wt.copy(this),t);const n=Wt.r,r=Wt.g,s=Wt.b,a=Math.max(n,r,s),o=Math.min(n,r,s);let l,c;const u=(o+a)/2;if(o===a)l=0,c=0;else{const h=a-o;switch(c=u<=.5?h/(a+o):h/(2-a-o),a){case n:l=(r-s)/h+(r<s?6:0);break;case r:l=(s-n)/h+2;break;case s:l=(n-r)/h+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=st.workingColorSpace){return st.fromWorkingColorSpace(Wt.copy(this),t),e.r=Wt.r,e.g=Wt.g,e.b=Wt.b,e}getStyle(e=Lt){st.fromWorkingColorSpace(Wt.copy(this),e);const t=Wt.r,n=Wt.g,r=Wt.b;return e!==Lt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(e,t,n){return this.getHSL(ti),this.setHSL(ti.h+e,ti.s+t,ti.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(ti),e.getHSL(ms);const n=Co(ti.h,ms.h,t),r=Co(ti.s,ms.s,t),s=Co(ti.l,ms.l,t);return this.setHSL(n,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*n+s[6]*r,this.g=s[1]*t+s[4]*n+s[7]*r,this.b=s[2]*t+s[5]*n+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Wt=new je;je.NAMES=Fu;let Zd=0;class Cr extends Vi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Zd++}),this.uuid=Jr(),this.name="",this.type="Material",this.blending=gr,this.side=gi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=pa,this.blendDst=ma,this.blendEquation=Ci,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new je(0,0,0),this.blendAlpha=0,this.depthFunc=ks,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Vl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=qi,this.stencilZFail=qi,this.stencilZPass=qi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==gr&&(n.blending=this.blending),this.side!==gi&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==pa&&(n.blendSrc=this.blendSrc),this.blendDst!==ma&&(n.blendDst=this.blendDst),this.blendEquation!==Ci&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==ks&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Vl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==qi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==qi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==qi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const r=t.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=t[s].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class Qr extends Cr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new je(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=vu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const wt=new w,gs=new Ne;class hn{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=kl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=ai,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)gs.fromBufferAttribute(this,t),gs.applyMatrix3(e),this.setXY(t,gs.x,gs.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix3(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix4(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.applyNormalMatrix(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.transformDirection(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Dr(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=en(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Dr(t,this.array)),t}setX(e,t){return this.normalized&&(t=en(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Dr(t,this.array)),t}setY(e,t){return this.normalized&&(t=en(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Dr(t,this.array)),t}setZ(e,t){return this.normalized&&(t=en(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Dr(t,this.array)),t}setW(e,t){return this.normalized&&(t=en(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=en(t,this.array),n=en(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=en(t,this.array),n=en(n,this.array),r=en(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,s){return e*=this.itemSize,this.normalized&&(t=en(t,this.array),n=en(n,this.array),r=en(r,this.array),s=en(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==kl&&(e.usage=this.usage),e}}class Ou extends hn{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class Bu extends hn{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class Ht extends hn{constructor(e,t,n){super(new Float32Array(e),t,n)}}let Jd=0;const pn=new at,Wo=new Dt,nr=new w,cn=new ki,Fr=new ki,Ft=new w;class jt extends Vi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Jd++}),this.uuid=Jr(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Du(e)?Bu:Ou)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Ke().getNormalMatrix(e);n.applyNormalMatrix(s),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return pn.makeRotationFromQuaternion(e),this.applyMatrix4(pn),this}rotateX(e){return pn.makeRotationX(e),this.applyMatrix4(pn),this}rotateY(e){return pn.makeRotationY(e),this.applyMatrix4(pn),this}rotateZ(e){return pn.makeRotationZ(e),this.applyMatrix4(pn),this}translate(e,t,n){return pn.makeTranslation(e,t,n),this.applyMatrix4(pn),this}scale(e,t,n){return pn.makeScale(e,t,n),this.applyMatrix4(pn),this}lookAt(e){return Wo.lookAt(e),Wo.updateMatrix(),this.applyMatrix4(Wo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(nr).negate(),this.translate(nr.x,nr.y,nr.z),this}setFromPoints(e){const t=[];for(let n=0,r=e.length;n<r;n++){const s=e[n];t.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new Ht(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ki);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new w(-1/0,-1/0,-1/0),new w(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,r=t.length;n<r;n++){const s=t[n];cn.setFromBufferAttribute(s),this.morphTargetsRelative?(Ft.addVectors(this.boundingBox.min,cn.min),this.boundingBox.expandByPoint(Ft),Ft.addVectors(this.boundingBox.max,cn.max),this.boundingBox.expandByPoint(Ft)):(this.boundingBox.expandByPoint(cn.min),this.boundingBox.expandByPoint(cn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Rr);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new w,1/0);return}if(e){const n=this.boundingSphere.center;if(cn.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];Fr.setFromBufferAttribute(o),this.morphTargetsRelative?(Ft.addVectors(cn.min,Fr.min),cn.expandByPoint(Ft),Ft.addVectors(cn.max,Fr.max),cn.expandByPoint(Ft)):(cn.expandByPoint(Fr.min),cn.expandByPoint(Fr.max))}cn.getCenter(n);let r=0;for(let s=0,a=e.count;s<a;s++)Ft.fromBufferAttribute(e,s),r=Math.max(r,n.distanceToSquared(Ft));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)Ft.fromBufferAttribute(o,c),l&&(nr.fromBufferAttribute(e,c),Ft.add(nr)),r=Math.max(r,n.distanceToSquared(Ft))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.array,r=t.position.array,s=t.normal.array,a=t.uv.array,o=r.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new hn(new Float32Array(4*o),4));const l=this.getAttribute("tangent").array,c=[],u=[];for(let A=0;A<o;A++)c[A]=new w,u[A]=new w;const h=new w,d=new w,m=new w,g=new Ne,_=new Ne,p=new Ne,f=new w,y=new w;function x(A,k,X){h.fromArray(r,A*3),d.fromArray(r,k*3),m.fromArray(r,X*3),g.fromArray(a,A*2),_.fromArray(a,k*2),p.fromArray(a,X*2),d.sub(h),m.sub(h),_.sub(g),p.sub(g);const oe=1/(_.x*p.y-p.x*_.y);isFinite(oe)&&(f.copy(d).multiplyScalar(p.y).addScaledVector(m,-_.y).multiplyScalar(oe),y.copy(m).multiplyScalar(_.x).addScaledVector(d,-p.x).multiplyScalar(oe),c[A].add(f),c[k].add(f),c[X].add(f),u[A].add(y),u[k].add(y),u[X].add(y))}let b=this.groups;b.length===0&&(b=[{start:0,count:n.length}]);for(let A=0,k=b.length;A<k;++A){const X=b[A],oe=X.start,D=X.count;for(let z=oe,V=oe+D;z<V;z+=3)x(n[z+0],n[z+1],n[z+2])}const L=new w,P=new w,R=new w,K=new w;function S(A){R.fromArray(s,A*3),K.copy(R);const k=c[A];L.copy(k),L.sub(R.multiplyScalar(R.dot(k))).normalize(),P.crossVectors(K,k);const oe=P.dot(u[A])<0?-1:1;l[A*4]=L.x,l[A*4+1]=L.y,l[A*4+2]=L.z,l[A*4+3]=oe}for(let A=0,k=b.length;A<k;++A){const X=b[A],oe=X.start,D=X.count;for(let z=oe,V=oe+D;z<V;z+=3)S(n[z+0]),S(n[z+1]),S(n[z+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new hn(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,m=n.count;d<m;d++)n.setXYZ(d,0,0,0);const r=new w,s=new w,a=new w,o=new w,l=new w,c=new w,u=new w,h=new w;if(e)for(let d=0,m=e.count;d<m;d+=3){const g=e.getX(d+0),_=e.getX(d+1),p=e.getX(d+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,_),a.fromBufferAttribute(t,p),u.subVectors(a,s),h.subVectors(r,s),u.cross(h),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,p),o.add(u),l.add(u),c.add(u),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let d=0,m=t.count;d<m;d+=3)r.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),u.subVectors(a,s),h.subVectors(r,s),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Ft.fromBufferAttribute(e,t),Ft.normalize(),e.setXYZ(t,Ft.x,Ft.y,Ft.z)}toNonIndexed(){function e(o,l){const c=o.array,u=o.itemSize,h=o.normalized,d=new c.constructor(l.length*u);let m=0,g=0;for(let _=0,p=l.length;_<p;_++){o.isInterleavedBufferAttribute?m=l[_]*o.data.stride+o.offset:m=l[_]*u;for(let f=0;f<u;f++)d[g++]=c[m++]}return new hn(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new jt,n=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=e(l,n);t.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let u=0,h=c.length;u<h;u++){const d=c[u],m=e(d,n);l.push(m)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const l in n){const c=n[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){const m=c[h];u.push(m.toJSON(e.data))}u.length>0&&(r[l]=u,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const r=e.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(t))}const s=e.morphAttributes;for(const c in s){const u=[],h=s[c];for(let d=0,m=h.length;d<m;d++)u.push(h[d].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,u=a.length;c<u;c++){const h=a[c];this.addGroup(h.start,h.count,h.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const ic=new at,Ti=new co,_s=new Rr,rc=new w,ir=new w,rr=new w,sr=new w,Xo=new w,xs=new w,vs=new Ne,Ms=new Ne,Ss=new Ne,sc=new w,oc=new w,ac=new w,Es=new w,ys=new w;class ct extends Dt{constructor(e=new jt,t=new Qr){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){xs.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const u=o[l],h=s[l];u!==0&&(Xo.fromBufferAttribute(h,e),a?xs.addScaledVector(Xo,u):xs.addScaledVector(Xo.sub(t),u))}t.add(xs)}return t}raycast(e,t){const n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),_s.copy(n.boundingSphere),_s.applyMatrix4(s),Ti.copy(e.ray).recast(e.near),!(_s.containsPoint(Ti.origin)===!1&&(Ti.intersectSphere(_s,rc)===null||Ti.origin.distanceToSquared(rc)>(e.far-e.near)**2))&&(ic.copy(s).invert(),Ti.copy(e.ray).applyMatrix4(ic),!(n.boundingBox!==null&&Ti.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Ti)))}_computeIntersections(e,t,n){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,u=s.attributes.uv1,h=s.attributes.normal,d=s.groups,m=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,_=d.length;g<_;g++){const p=d[g],f=a[p.materialIndex],y=Math.max(p.start,m.start),x=Math.min(o.count,Math.min(p.start+p.count,m.start+m.count));for(let b=y,L=x;b<L;b+=3){const P=o.getX(b),R=o.getX(b+1),K=o.getX(b+2);r=bs(this,f,e,n,c,u,h,P,R,K),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{const g=Math.max(0,m.start),_=Math.min(o.count,m.start+m.count);for(let p=g,f=_;p<f;p+=3){const y=o.getX(p),x=o.getX(p+1),b=o.getX(p+2);r=bs(this,a,e,n,c,u,h,y,x,b),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,_=d.length;g<_;g++){const p=d[g],f=a[p.materialIndex],y=Math.max(p.start,m.start),x=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let b=y,L=x;b<L;b+=3){const P=b,R=b+1,K=b+2;r=bs(this,f,e,n,c,u,h,P,R,K),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{const g=Math.max(0,m.start),_=Math.min(l.count,m.start+m.count);for(let p=g,f=_;p<f;p+=3){const y=p,x=p+1,b=p+2;r=bs(this,a,e,n,c,u,h,y,x,b),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}}}function Qd(i,e,t,n,r,s,a,o){let l;if(e.side===Qt?l=n.intersectTriangle(a,s,r,!0,o):l=n.intersectTriangle(r,s,a,e.side===gi,o),l===null)return null;ys.copy(o),ys.applyMatrix4(i.matrixWorld);const c=t.ray.origin.distanceTo(ys);return c<t.near||c>t.far?null:{distance:c,point:ys.clone(),object:i}}function bs(i,e,t,n,r,s,a,o,l,c){i.getVertexPosition(o,ir),i.getVertexPosition(l,rr),i.getVertexPosition(c,sr);const u=Qd(i,e,t,n,ir,rr,sr,Es);if(u){r&&(vs.fromBufferAttribute(r,o),Ms.fromBufferAttribute(r,l),Ss.fromBufferAttribute(r,c),u.uv=gn.getInterpolation(Es,ir,rr,sr,vs,Ms,Ss,new Ne)),s&&(vs.fromBufferAttribute(s,o),Ms.fromBufferAttribute(s,l),Ss.fromBufferAttribute(s,c),u.uv1=gn.getInterpolation(Es,ir,rr,sr,vs,Ms,Ss,new Ne),u.uv2=u.uv1),a&&(sc.fromBufferAttribute(a,o),oc.fromBufferAttribute(a,l),ac.fromBufferAttribute(a,c),u.normal=gn.getInterpolation(Es,ir,rr,sr,sc,oc,ac,new w),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const h={a:o,b:l,c,normal:new w,materialIndex:0};gn.getNormal(ir,rr,sr,h.normal),u.face=h}return u}class Wi extends jt{constructor(e=1,t=1,n=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],u=[],h=[];let d=0,m=0;g("z","y","x",-1,-1,n,t,e,a,s,0),g("z","y","x",1,-1,n,t,-e,a,s,1),g("x","z","y",1,1,e,n,t,r,a,2),g("x","z","y",1,-1,e,n,-t,r,a,3),g("x","y","z",1,-1,e,t,n,r,s,4),g("x","y","z",-1,-1,e,t,-n,r,s,5),this.setIndex(l),this.setAttribute("position",new Ht(c,3)),this.setAttribute("normal",new Ht(u,3)),this.setAttribute("uv",new Ht(h,2));function g(_,p,f,y,x,b,L,P,R,K,S){const A=b/R,k=L/K,X=b/2,oe=L/2,D=P/2,z=R+1,V=K+1;let j=0,Y=0;const q=new w;for(let $=0;$<V;$++){const se=$*k-oe;for(let ae=0;ae<z;ae++){const G=ae*A-X;q[_]=G*y,q[p]=se*x,q[f]=D,c.push(q.x,q.y,q.z),q[_]=0,q[p]=0,q[f]=P>0?1:-1,u.push(q.x,q.y,q.z),h.push(ae/R),h.push(1-$/K),j+=1}}for(let $=0;$<K;$++)for(let se=0;se<R;se++){const ae=d+se+z*$,G=d+se+z*($+1),Z=d+(se+1)+z*($+1),he=d+(se+1)+z*$;l.push(ae,G,he),l.push(G,Z,he),Y+=6}o.addGroup(m,Y,S),m+=Y,d+=j}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Wi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function yr(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const r=i[t][n];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=r.clone():Array.isArray(r)?e[t][n]=r.slice():e[t][n]=r}}return e}function $t(i){const e={};for(let t=0;t<i.length;t++){const n=yr(i[t]);for(const r in n)e[r]=n[r]}return e}function ef(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function zu(i){return i.getRenderTarget()===null?i.outputColorSpace:st.workingColorSpace}const tf={clone:yr,merge:$t};var nf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,rf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Oi extends Cr{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=nf,this.fragmentShader=rf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=yr(e.uniforms),this.uniformsGroups=ef(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class Hu extends Dt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new at,this.projectionMatrix=new at,this.projectionMatrixInverse=new at,this.coordinateSystem=qn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class sn extends Hu{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Sa*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Os*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Sa*2*Math.atan(Math.tan(Os*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,n,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Os*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*n/c,r*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const or=-90,ar=1;class sf extends Dt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new sn(or,ar,e,t);r.layers=this.layers,this.add(r);const s=new sn(or,ar,e,t);s.layers=this.layers,this.add(s);const a=new sn(or,ar,e,t);a.layers=this.layers,this.add(a);const o=new sn(or,ar,e,t);o.layers=this.layers,this.add(o);const l=new sn(or,ar,e,t);l.layers=this.layers,this.add(l);const c=new sn(or,ar,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,r,s,a,o,l]=t;for(const c of t)this.remove(c);if(e===qn)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===qs)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,u]=this.children,h=e.getRenderTarget(),d=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,r),e.render(t,s),e.setRenderTarget(n,1,r),e.render(t,a),e.setRenderTarget(n,2,r),e.render(t,o),e.setRenderTarget(n,3,r),e.render(t,l),e.setRenderTarget(n,4,r),e.render(t,c),n.texture.generateMipmaps=_,e.setRenderTarget(n,5,r),e.render(t,u),e.setRenderTarget(h,d,m),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class Gu extends un{constructor(e,t,n,r,s,a,o,l,c,u){e=e!==void 0?e:[],t=t!==void 0?t:Mr,super(e,t,n,r,s,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class of extends Fi{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];t.encoding!==void 0&&(Vr("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===Ni?Lt:xn),this.texture=new Gu(r,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:mn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Wi(5,5,5),s=new Oi({name:"CubemapFromEquirect",uniforms:yr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Qt,blending:di});s.uniforms.tEquirect.value=t;const a=new ct(r,s),o=t.minFilter;return t.minFilter===qr&&(t.minFilter=mn),new sf(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,r){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,r);e.setRenderTarget(s)}}const Yo=new w,af=new w,lf=new Ke;class An{constructor(e=new w(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const r=Yo.subVectors(n,t).cross(af.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(Yo),r=this.normal.dot(n);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const s=-(e.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:t.copy(e.start).addScaledVector(n,s)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||lf.getNormalMatrix(e),r=this.coplanarPoint(Yo).applyMatrix4(e),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Ai=new Rr,Ts=new w;class Xa{constructor(e=new An,t=new An,n=new An,r=new An,s=new An,a=new An){this.planes=[e,t,n,r,s,a]}set(e,t,n,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=qn){const n=this.planes,r=e.elements,s=r[0],a=r[1],o=r[2],l=r[3],c=r[4],u=r[5],h=r[6],d=r[7],m=r[8],g=r[9],_=r[10],p=r[11],f=r[12],y=r[13],x=r[14],b=r[15];if(n[0].setComponents(l-s,d-c,p-m,b-f).normalize(),n[1].setComponents(l+s,d+c,p+m,b+f).normalize(),n[2].setComponents(l+a,d+u,p+g,b+y).normalize(),n[3].setComponents(l-a,d-u,p-g,b-y).normalize(),n[4].setComponents(l-o,d-h,p-_,b-x).normalize(),t===qn)n[5].setComponents(l+o,d+h,p+_,b+x).normalize();else if(t===qs)n[5].setComponents(o,h,_,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ai.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ai.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ai)}intersectsSprite(e){return Ai.center.set(0,0,0),Ai.radius=.7071067811865476,Ai.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ai)}intersectsSphere(e){const t=this.planes,n=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const r=t[n];if(Ts.x=r.normal.x>0?e.max.x:e.min.x,Ts.y=r.normal.y>0?e.max.y:e.min.y,Ts.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Ts)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Vu(){let i=null,e=!1,t=null,n=null;function r(s,a){t(s,a),n=i.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(r),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){i=s}}}function cf(i,e){const t=e.isWebGL2,n=new WeakMap;function r(c,u){const h=c.array,d=c.usage,m=h.byteLength,g=i.createBuffer();i.bindBuffer(u,g),i.bufferData(u,h,d),c.onUploadCallback();let _;if(h instanceof Float32Array)_=i.FLOAT;else if(h instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(t)_=i.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else _=i.UNSIGNED_SHORT;else if(h instanceof Int16Array)_=i.SHORT;else if(h instanceof Uint32Array)_=i.UNSIGNED_INT;else if(h instanceof Int32Array)_=i.INT;else if(h instanceof Int8Array)_=i.BYTE;else if(h instanceof Uint8Array)_=i.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)_=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:g,type:_,bytesPerElement:h.BYTES_PER_ELEMENT,version:c.version,size:m}}function s(c,u,h){const d=u.array,m=u._updateRange,g=u.updateRanges;if(i.bindBuffer(h,c),m.count===-1&&g.length===0&&i.bufferSubData(h,0,d),g.length!==0){for(let _=0,p=g.length;_<p;_++){const f=g[_];t?i.bufferSubData(h,f.start*d.BYTES_PER_ELEMENT,d,f.start,f.count):i.bufferSubData(h,f.start*d.BYTES_PER_ELEMENT,d.subarray(f.start,f.start+f.count))}u.clearUpdateRanges()}m.count!==-1&&(t?i.bufferSubData(h,m.offset*d.BYTES_PER_ELEMENT,d,m.offset,m.count):i.bufferSubData(h,m.offset*d.BYTES_PER_ELEMENT,d.subarray(m.offset,m.offset+m.count)),m.count=-1),u.onUploadCallback()}function a(c){return c.isInterleavedBufferAttribute&&(c=c.data),n.get(c)}function o(c){c.isInterleavedBufferAttribute&&(c=c.data);const u=n.get(c);u&&(i.deleteBuffer(u.buffer),n.delete(c))}function l(c,u){if(c.isGLBufferAttribute){const d=n.get(c);(!d||d.version<c.version)&&n.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);const h=n.get(c);if(h===void 0)n.set(c,r(c,u));else if(h.version<c.version){if(h.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");s(h.buffer,c,u),h.version=c.version}}return{get:a,remove:o,update:l}}class Ya extends jt{constructor(e=1,t=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(n),l=Math.floor(r),c=o+1,u=l+1,h=e/o,d=t/l,m=[],g=[],_=[],p=[];for(let f=0;f<u;f++){const y=f*d-a;for(let x=0;x<c;x++){const b=x*h-s;g.push(b,-y,0),_.push(0,0,1),p.push(x/o),p.push(1-f/l)}}for(let f=0;f<l;f++)for(let y=0;y<o;y++){const x=y+c*f,b=y+c*(f+1),L=y+1+c*(f+1),P=y+1+c*f;m.push(x,b,P),m.push(b,L,P)}this.setIndex(m),this.setAttribute("position",new Ht(g,3)),this.setAttribute("normal",new Ht(_,3)),this.setAttribute("uv",new Ht(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ya(e.width,e.height,e.widthSegments,e.heightSegments)}}var uf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,hf=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,df=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ff=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,pf=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,mf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,gf=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,_f=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,xf=`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,vf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,Mf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Sf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Ef=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,yf=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bf=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Tf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,Af=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,wf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Rf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Cf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Pf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Lf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,Df=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,If=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Uf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Nf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Ff=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Of=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Bf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,zf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Hf="gl_FragColor = linearToOutputTexel( gl_FragColor );",Gf=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,Vf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,kf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Wf=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Xf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Yf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,qf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,jf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,$f=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Kf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Zf=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Jf=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,Qf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,ep=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,tp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,np=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,ip=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,rp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,sp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,op=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,ap=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,cp=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,up=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,hp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,dp=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,fp=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,pp=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,mp=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,gp=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,_p=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,xp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,vp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Mp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Sp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ep=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,yp=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,bp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,Tp=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,Ap=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,wp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Rp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Cp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Pp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Lp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Dp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Ip=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Up=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Np=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Fp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Op=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Bp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,zp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Hp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Gp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Vp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,kp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Wp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Xp=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,Yp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,qp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,jp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,$p=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Kp=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Zp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Jp=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Qp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,em=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,nm=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color *= toneMappingExposure;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	return color;
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,im=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,rm=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,sm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,om=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,am=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,lm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const cm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,um=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,hm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,dm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,fm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,pm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,mm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,gm=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,_m=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,xm=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,vm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Mm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Sm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Em=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,ym=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,bm=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Tm=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Am=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Rm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Cm=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Pm=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Lm=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Dm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Im=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Um=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Nm=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Fm=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Om=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Bm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,zm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Hm=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Gm=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Vm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,We={alphahash_fragment:uf,alphahash_pars_fragment:hf,alphamap_fragment:df,alphamap_pars_fragment:ff,alphatest_fragment:pf,alphatest_pars_fragment:mf,aomap_fragment:gf,aomap_pars_fragment:_f,batching_pars_vertex:xf,batching_vertex:vf,begin_vertex:Mf,beginnormal_vertex:Sf,bsdfs:Ef,iridescence_fragment:yf,bumpmap_pars_fragment:bf,clipping_planes_fragment:Tf,clipping_planes_pars_fragment:Af,clipping_planes_pars_vertex:wf,clipping_planes_vertex:Rf,color_fragment:Cf,color_pars_fragment:Pf,color_pars_vertex:Lf,color_vertex:Df,common:If,cube_uv_reflection_fragment:Uf,defaultnormal_vertex:Nf,displacementmap_pars_vertex:Ff,displacementmap_vertex:Of,emissivemap_fragment:Bf,emissivemap_pars_fragment:zf,colorspace_fragment:Hf,colorspace_pars_fragment:Gf,envmap_fragment:Vf,envmap_common_pars_fragment:kf,envmap_pars_fragment:Wf,envmap_pars_vertex:Xf,envmap_physical_pars_fragment:ip,envmap_vertex:Yf,fog_vertex:qf,fog_pars_vertex:jf,fog_fragment:$f,fog_pars_fragment:Kf,gradientmap_pars_fragment:Zf,lightmap_fragment:Jf,lightmap_pars_fragment:Qf,lights_lambert_fragment:ep,lights_lambert_pars_fragment:tp,lights_pars_begin:np,lights_toon_fragment:rp,lights_toon_pars_fragment:sp,lights_phong_fragment:op,lights_phong_pars_fragment:ap,lights_physical_fragment:lp,lights_physical_pars_fragment:cp,lights_fragment_begin:up,lights_fragment_maps:hp,lights_fragment_end:dp,logdepthbuf_fragment:fp,logdepthbuf_pars_fragment:pp,logdepthbuf_pars_vertex:mp,logdepthbuf_vertex:gp,map_fragment:_p,map_pars_fragment:xp,map_particle_fragment:vp,map_particle_pars_fragment:Mp,metalnessmap_fragment:Sp,metalnessmap_pars_fragment:Ep,morphcolor_vertex:yp,morphnormal_vertex:bp,morphtarget_pars_vertex:Tp,morphtarget_vertex:Ap,normal_fragment_begin:wp,normal_fragment_maps:Rp,normal_pars_fragment:Cp,normal_pars_vertex:Pp,normal_vertex:Lp,normalmap_pars_fragment:Dp,clearcoat_normal_fragment_begin:Ip,clearcoat_normal_fragment_maps:Up,clearcoat_pars_fragment:Np,iridescence_pars_fragment:Fp,opaque_fragment:Op,packing:Bp,premultiplied_alpha_fragment:zp,project_vertex:Hp,dithering_fragment:Gp,dithering_pars_fragment:Vp,roughnessmap_fragment:kp,roughnessmap_pars_fragment:Wp,shadowmap_pars_fragment:Xp,shadowmap_pars_vertex:Yp,shadowmap_vertex:qp,shadowmask_pars_fragment:jp,skinbase_vertex:$p,skinning_pars_vertex:Kp,skinning_vertex:Zp,skinnormal_vertex:Jp,specularmap_fragment:Qp,specularmap_pars_fragment:em,tonemapping_fragment:tm,tonemapping_pars_fragment:nm,transmission_fragment:im,transmission_pars_fragment:rm,uv_pars_fragment:sm,uv_pars_vertex:om,uv_vertex:am,worldpos_vertex:lm,background_vert:cm,background_frag:um,backgroundCube_vert:hm,backgroundCube_frag:dm,cube_vert:fm,cube_frag:pm,depth_vert:mm,depth_frag:gm,distanceRGBA_vert:_m,distanceRGBA_frag:xm,equirect_vert:vm,equirect_frag:Mm,linedashed_vert:Sm,linedashed_frag:Em,meshbasic_vert:ym,meshbasic_frag:bm,meshlambert_vert:Tm,meshlambert_frag:Am,meshmatcap_vert:wm,meshmatcap_frag:Rm,meshnormal_vert:Cm,meshnormal_frag:Pm,meshphong_vert:Lm,meshphong_frag:Dm,meshphysical_vert:Im,meshphysical_frag:Um,meshtoon_vert:Nm,meshtoon_frag:Fm,points_vert:Om,points_frag:Bm,shadow_vert:zm,shadow_frag:Hm,sprite_vert:Gm,sprite_frag:Vm},le={common:{diffuse:{value:new je(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ke},alphaMap:{value:null},alphaMapTransform:{value:new Ke},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ke}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ke}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ke}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ke},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ke},normalScale:{value:new Ne(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ke},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ke}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ke}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ke}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new je(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new je(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ke},alphaTest:{value:0},uvTransform:{value:new Ke}},sprite:{diffuse:{value:new je(16777215)},opacity:{value:1},center:{value:new Ne(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ke},alphaMap:{value:null},alphaMapTransform:{value:new Ke},alphaTest:{value:0}}},Dn={basic:{uniforms:$t([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.fog]),vertexShader:We.meshbasic_vert,fragmentShader:We.meshbasic_frag},lambert:{uniforms:$t([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new je(0)}}]),vertexShader:We.meshlambert_vert,fragmentShader:We.meshlambert_frag},phong:{uniforms:$t([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new je(0)},specular:{value:new je(1118481)},shininess:{value:30}}]),vertexShader:We.meshphong_vert,fragmentShader:We.meshphong_frag},standard:{uniforms:$t([le.common,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.roughnessmap,le.metalnessmap,le.fog,le.lights,{emissive:{value:new je(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:We.meshphysical_vert,fragmentShader:We.meshphysical_frag},toon:{uniforms:$t([le.common,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.gradientmap,le.fog,le.lights,{emissive:{value:new je(0)}}]),vertexShader:We.meshtoon_vert,fragmentShader:We.meshtoon_frag},matcap:{uniforms:$t([le.common,le.bumpmap,le.normalmap,le.displacementmap,le.fog,{matcap:{value:null}}]),vertexShader:We.meshmatcap_vert,fragmentShader:We.meshmatcap_frag},points:{uniforms:$t([le.points,le.fog]),vertexShader:We.points_vert,fragmentShader:We.points_frag},dashed:{uniforms:$t([le.common,le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:We.linedashed_vert,fragmentShader:We.linedashed_frag},depth:{uniforms:$t([le.common,le.displacementmap]),vertexShader:We.depth_vert,fragmentShader:We.depth_frag},normal:{uniforms:$t([le.common,le.bumpmap,le.normalmap,le.displacementmap,{opacity:{value:1}}]),vertexShader:We.meshnormal_vert,fragmentShader:We.meshnormal_frag},sprite:{uniforms:$t([le.sprite,le.fog]),vertexShader:We.sprite_vert,fragmentShader:We.sprite_frag},background:{uniforms:{uvTransform:{value:new Ke},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:We.background_vert,fragmentShader:We.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:We.backgroundCube_vert,fragmentShader:We.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:We.cube_vert,fragmentShader:We.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:We.equirect_vert,fragmentShader:We.equirect_frag},distanceRGBA:{uniforms:$t([le.common,le.displacementmap,{referencePosition:{value:new w},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:We.distanceRGBA_vert,fragmentShader:We.distanceRGBA_frag},shadow:{uniforms:$t([le.lights,le.fog,{color:{value:new je(0)},opacity:{value:1}}]),vertexShader:We.shadow_vert,fragmentShader:We.shadow_frag}};Dn.physical={uniforms:$t([Dn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ke},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ke},clearcoatNormalScale:{value:new Ne(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ke},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ke},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ke},sheen:{value:0},sheenColor:{value:new je(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ke},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ke},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ke},transmissionSamplerSize:{value:new Ne},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ke},attenuationDistance:{value:0},attenuationColor:{value:new je(0)},specularColor:{value:new je(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ke},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ke},anisotropyVector:{value:new Ne},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ke}}]),vertexShader:We.meshphysical_vert,fragmentShader:We.meshphysical_frag};const As={r:0,b:0,g:0};function km(i,e,t,n,r,s,a){const o=new je(0);let l=s===!0?0:1,c,u,h=null,d=0,m=null;function g(p,f){let y=!1,x=f.isScene===!0?f.background:null;x&&x.isTexture&&(x=(f.backgroundBlurriness>0?t:e).get(x)),x===null?_(o,l):x&&x.isColor&&(_(x,1),y=!0);const b=i.xr.getEnvironmentBlendMode();b==="additive"?n.buffers.color.setClear(0,0,0,1,a):b==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||y)&&i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil),x&&(x.isCubeTexture||x.mapping===ao)?(u===void 0&&(u=new ct(new Wi(1,1,1),new Oi({name:"BackgroundCubeMaterial",uniforms:yr(Dn.backgroundCube.uniforms),vertexShader:Dn.backgroundCube.vertexShader,fragmentShader:Dn.backgroundCube.fragmentShader,side:Qt,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(L,P,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),u.material.uniforms.envMap.value=x,u.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=f.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,u.material.toneMapped=st.getTransfer(x.colorSpace)!==dt,(h!==x||d!==x.version||m!==i.toneMapping)&&(u.material.needsUpdate=!0,h=x,d=x.version,m=i.toneMapping),u.layers.enableAll(),p.unshift(u,u.geometry,u.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new ct(new Ya(2,2),new Oi({name:"BackgroundMaterial",uniforms:yr(Dn.background.uniforms),vertexShader:Dn.background.vertexShader,fragmentShader:Dn.background.fragmentShader,side:gi,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,c.material.toneMapped=st.getTransfer(x.colorSpace)!==dt,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||d!==x.version||m!==i.toneMapping)&&(c.material.needsUpdate=!0,h=x,d=x.version,m=i.toneMapping),c.layers.enableAll(),p.unshift(c,c.geometry,c.material,0,0,null))}function _(p,f){p.getRGB(As,zu(i)),n.buffers.color.setClear(As.r,As.g,As.b,f,a)}return{getClearColor:function(){return o},setClearColor:function(p,f=1){o.set(p),l=f,_(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(p){l=p,_(o,l)},render:g}}function Wm(i,e,t,n){const r=i.getParameter(i.MAX_VERTEX_ATTRIBS),s=n.isWebGL2?null:e.get("OES_vertex_array_object"),a=n.isWebGL2||s!==null,o={},l=p(null);let c=l,u=!1;function h(D,z,V,j,Y){let q=!1;if(a){const $=_(j,V,z);c!==$&&(c=$,m(c.object)),q=f(D,j,V,Y),q&&y(D,j,V,Y)}else{const $=z.wireframe===!0;(c.geometry!==j.id||c.program!==V.id||c.wireframe!==$)&&(c.geometry=j.id,c.program=V.id,c.wireframe=$,q=!0)}Y!==null&&t.update(Y,i.ELEMENT_ARRAY_BUFFER),(q||u)&&(u=!1,K(D,z,V,j),Y!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(Y).buffer))}function d(){return n.isWebGL2?i.createVertexArray():s.createVertexArrayOES()}function m(D){return n.isWebGL2?i.bindVertexArray(D):s.bindVertexArrayOES(D)}function g(D){return n.isWebGL2?i.deleteVertexArray(D):s.deleteVertexArrayOES(D)}function _(D,z,V){const j=V.wireframe===!0;let Y=o[D.id];Y===void 0&&(Y={},o[D.id]=Y);let q=Y[z.id];q===void 0&&(q={},Y[z.id]=q);let $=q[j];return $===void 0&&($=p(d()),q[j]=$),$}function p(D){const z=[],V=[],j=[];for(let Y=0;Y<r;Y++)z[Y]=0,V[Y]=0,j[Y]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:z,enabledAttributes:V,attributeDivisors:j,object:D,attributes:{},index:null}}function f(D,z,V,j){const Y=c.attributes,q=z.attributes;let $=0;const se=V.getAttributes();for(const ae in se)if(se[ae].location>=0){const Z=Y[ae];let he=q[ae];if(he===void 0&&(ae==="instanceMatrix"&&D.instanceMatrix&&(he=D.instanceMatrix),ae==="instanceColor"&&D.instanceColor&&(he=D.instanceColor)),Z===void 0||Z.attribute!==he||he&&Z.data!==he.data)return!0;$++}return c.attributesNum!==$||c.index!==j}function y(D,z,V,j){const Y={},q=z.attributes;let $=0;const se=V.getAttributes();for(const ae in se)if(se[ae].location>=0){let Z=q[ae];Z===void 0&&(ae==="instanceMatrix"&&D.instanceMatrix&&(Z=D.instanceMatrix),ae==="instanceColor"&&D.instanceColor&&(Z=D.instanceColor));const he={};he.attribute=Z,Z&&Z.data&&(he.data=Z.data),Y[ae]=he,$++}c.attributes=Y,c.attributesNum=$,c.index=j}function x(){const D=c.newAttributes;for(let z=0,V=D.length;z<V;z++)D[z]=0}function b(D){L(D,0)}function L(D,z){const V=c.newAttributes,j=c.enabledAttributes,Y=c.attributeDivisors;V[D]=1,j[D]===0&&(i.enableVertexAttribArray(D),j[D]=1),Y[D]!==z&&((n.isWebGL2?i:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](D,z),Y[D]=z)}function P(){const D=c.newAttributes,z=c.enabledAttributes;for(let V=0,j=z.length;V<j;V++)z[V]!==D[V]&&(i.disableVertexAttribArray(V),z[V]=0)}function R(D,z,V,j,Y,q,$){$===!0?i.vertexAttribIPointer(D,z,V,Y,q):i.vertexAttribPointer(D,z,V,j,Y,q)}function K(D,z,V,j){if(n.isWebGL2===!1&&(D.isInstancedMesh||j.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;x();const Y=j.attributes,q=V.getAttributes(),$=z.defaultAttributeValues;for(const se in q){const ae=q[se];if(ae.location>=0){let G=Y[se];if(G===void 0&&(se==="instanceMatrix"&&D.instanceMatrix&&(G=D.instanceMatrix),se==="instanceColor"&&D.instanceColor&&(G=D.instanceColor)),G!==void 0){const Z=G.normalized,he=G.itemSize,Se=t.get(G);if(Se===void 0)continue;const ve=Se.buffer,Fe=Se.type,Oe=Se.bytesPerElement,we=n.isWebGL2===!0&&(Fe===i.INT||Fe===i.UNSIGNED_INT||G.gpuType===Eu);if(G.isInterleavedBufferAttribute){const Ze=G.data,F=Ze.stride,Ot=G.offset;if(Ze.isInstancedInterleavedBuffer){for(let be=0;be<ae.locationSize;be++)L(ae.location+be,Ze.meshPerAttribute);D.isInstancedMesh!==!0&&j._maxInstanceCount===void 0&&(j._maxInstanceCount=Ze.meshPerAttribute*Ze.count)}else for(let be=0;be<ae.locationSize;be++)b(ae.location+be);i.bindBuffer(i.ARRAY_BUFFER,ve);for(let be=0;be<ae.locationSize;be++)R(ae.location+be,he/ae.locationSize,Fe,Z,F*Oe,(Ot+he/ae.locationSize*be)*Oe,we)}else{if(G.isInstancedBufferAttribute){for(let Ze=0;Ze<ae.locationSize;Ze++)L(ae.location+Ze,G.meshPerAttribute);D.isInstancedMesh!==!0&&j._maxInstanceCount===void 0&&(j._maxInstanceCount=G.meshPerAttribute*G.count)}else for(let Ze=0;Ze<ae.locationSize;Ze++)b(ae.location+Ze);i.bindBuffer(i.ARRAY_BUFFER,ve);for(let Ze=0;Ze<ae.locationSize;Ze++)R(ae.location+Ze,he/ae.locationSize,Fe,Z,he*Oe,he/ae.locationSize*Ze*Oe,we)}}else if($!==void 0){const Z=$[se];if(Z!==void 0)switch(Z.length){case 2:i.vertexAttrib2fv(ae.location,Z);break;case 3:i.vertexAttrib3fv(ae.location,Z);break;case 4:i.vertexAttrib4fv(ae.location,Z);break;default:i.vertexAttrib1fv(ae.location,Z)}}}}P()}function S(){X();for(const D in o){const z=o[D];for(const V in z){const j=z[V];for(const Y in j)g(j[Y].object),delete j[Y];delete z[V]}delete o[D]}}function A(D){if(o[D.id]===void 0)return;const z=o[D.id];for(const V in z){const j=z[V];for(const Y in j)g(j[Y].object),delete j[Y];delete z[V]}delete o[D.id]}function k(D){for(const z in o){const V=o[z];if(V[D.id]===void 0)continue;const j=V[D.id];for(const Y in j)g(j[Y].object),delete j[Y];delete V[D.id]}}function X(){oe(),u=!0,c!==l&&(c=l,m(c.object))}function oe(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:h,reset:X,resetDefaultState:oe,dispose:S,releaseStatesOfGeometry:A,releaseStatesOfProgram:k,initAttributes:x,enableAttribute:b,disableUnusedAttributes:P}}function Xm(i,e,t,n){const r=n.isWebGL2;let s;function a(u){s=u}function o(u,h){i.drawArrays(s,u,h),t.update(h,s,1)}function l(u,h,d){if(d===0)return;let m,g;if(r)m=i,g="drawArraysInstanced";else if(m=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",m===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[g](s,u,h,d),t.update(h,s,d)}function c(u,h,d){if(d===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<d;g++)this.render(u[g],h[g]);else{m.multiDrawArraysWEBGL(s,u,0,h,0,d);let g=0;for(let _=0;_<d;_++)g+=h[_];t.update(g,s,1)}}this.setMode=a,this.render=o,this.renderInstances=l,this.renderMultiDraw=c}function Ym(i,e,t){let n;function r(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){const R=e.get("EXT_texture_filter_anisotropic");n=i.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function s(R){if(R==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const a=typeof WebGL2RenderingContext<"u"&&i.constructor.name==="WebGL2RenderingContext";let o=t.precision!==void 0?t.precision:"highp";const l=s(o);l!==o&&(console.warn("THREE.WebGLRenderer:",o,"not supported, using",l,"instead."),o=l);const c=a||e.has("WEBGL_draw_buffers"),u=t.logarithmicDepthBuffer===!0,h=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),d=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),m=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),_=i.getParameter(i.MAX_VERTEX_ATTRIBS),p=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),f=i.getParameter(i.MAX_VARYING_VECTORS),y=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),x=d>0,b=a||e.has("OES_texture_float"),L=x&&b,P=a?i.getParameter(i.MAX_SAMPLES):0;return{isWebGL2:a,drawBuffers:c,getMaxAnisotropy:r,getMaxPrecision:s,precision:o,logarithmicDepthBuffer:u,maxTextures:h,maxVertexTextures:d,maxTextureSize:m,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:p,maxVaryings:f,maxFragmentUniforms:y,vertexTextures:x,floatFragmentTextures:b,floatVertexTextures:L,maxSamples:P}}function qm(i){const e=this;let t=null,n=0,r=!1,s=!1;const a=new An,o=new Ke,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const m=h.length!==0||d||n!==0||r;return r=d,n=h.length,m},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(h,d){t=u(h,d,0)},this.setState=function(h,d,m){const g=h.clippingPlanes,_=h.clipIntersection,p=h.clipShadows,f=i.get(h);if(!r||g===null||g.length===0||s&&!p)s?u(null):c();else{const y=s?0:n,x=y*4;let b=f.clippingState||null;l.value=b,b=u(g,d,x,m);for(let L=0;L!==x;++L)b[L]=t[L];f.clippingState=b,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=y}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(h,d,m,g){const _=h!==null?h.length:0;let p=null;if(_!==0){if(p=l.value,g!==!0||p===null){const f=m+_*4,y=d.matrixWorldInverse;o.getNormalMatrix(y),(p===null||p.length<f)&&(p=new Float32Array(f));for(let x=0,b=m;x!==_;++x,b+=4)a.copy(h[x]).applyMatrix4(y,o),a.normal.toArray(p,b),p[b+3]=a.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,p}}function jm(i){let e=new WeakMap;function t(a,o){return o===ga?a.mapping=Mr:o===_a&&(a.mapping=Sr),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===ga||o===_a)if(e.has(a)){const l=e.get(a).texture;return t(l,a.mapping)}else{const l=a.image;if(l&&l.height>0){const c=new of(l.height/2);return c.fromEquirectangularTexture(i,a),e.set(a,c),a.addEventListener("dispose",r),t(c.texture,a.mapping)}else return null}}return a}function r(a){const o=a.target;o.removeEventListener("dispose",r);const l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function s(){e=new WeakMap}return{get:n,dispose:s}}class ku extends Hu{constructor(e=-1,t=1,n=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=n-e,a=n+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const dr=4,lc=[.125,.215,.35,.446,.526,.582],Pi=20,qo=new ku,cc=new je;let jo=null,$o=0,Ko=0;const Ri=(1+Math.sqrt(5))/2,lr=1/Ri,uc=[new w(1,1,1),new w(-1,1,1),new w(1,1,-1),new w(-1,1,-1),new w(0,Ri,lr),new w(0,Ri,-lr),new w(lr,0,Ri),new w(-lr,0,Ri),new w(Ri,lr,0),new w(-Ri,lr,0)];class ya{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,r=100){jo=this._renderer.getRenderTarget(),$o=this._renderer.getActiveCubeFace(),Ko=this._renderer.getActiveMipmapLevel(),this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=fc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=dc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(jo,$o,Ko),e.scissorTest=!1,ws(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Mr||e.mapping===Sr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),jo=this._renderer.getRenderTarget(),$o=this._renderer.getActiveCubeFace(),Ko=this._renderer.getActiveMipmapLevel();const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:mn,minFilter:mn,generateMipmaps:!1,type:jr,format:Pn,colorSpace:$n,depthBuffer:!1},r=hc(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=hc(e,t,n);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=$m(s)),this._blurMaterial=Km(s,e,t)}return r}_compileMaterial(e){const t=new ct(this._lodPlanes[0],e);this._renderer.compile(t,qo)}_sceneToCubeUV(e,t,n,r){const o=new sn(90,1,t,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,d=u.toneMapping;u.getClearColor(cc),u.toneMapping=fi,u.autoClear=!1;const m=new Qr({name:"PMREM.Background",side:Qt,depthWrite:!1,depthTest:!1}),g=new ct(new Wi,m);let _=!1;const p=e.background;p?p.isColor&&(m.color.copy(p),e.background=null,_=!0):(m.color.copy(cc),_=!0);for(let f=0;f<6;f++){const y=f%3;y===0?(o.up.set(0,l[f],0),o.lookAt(c[f],0,0)):y===1?(o.up.set(0,0,l[f]),o.lookAt(0,c[f],0)):(o.up.set(0,l[f],0),o.lookAt(0,0,c[f]));const x=this._cubeSize;ws(r,y*x,f>2?x:0,x,x),u.setRenderTarget(r),_&&u.render(g,o),u.render(e,o)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=d,u.autoClear=h,e.background=p}_textureToCubeUV(e,t){const n=this._renderer,r=e.mapping===Mr||e.mapping===Sr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=fc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=dc());const s=r?this._cubemapMaterial:this._equirectMaterial,a=new ct(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;ws(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,qo)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;for(let r=1;r<this._lodPlanes.length;r++){const s=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=uc[(r-1)%uc.length];this._blur(e,r-1,r,s,a)}t.autoClear=n}_blur(e,t,n,r,s){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,r,"latitudinal",s),this._halfBlur(a,e,n,n,r,"longitudinal",s)}_halfBlur(e,t,n,r,s,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new ct(this._lodPlanes[r],c),d=c.uniforms,m=this._sizeLods[n]-1,g=isFinite(s)?Math.PI/(2*m):2*Math.PI/(2*Pi-1),_=s/g,p=isFinite(s)?1+Math.floor(u*_):Pi;p>Pi&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Pi}`);const f=[];let y=0;for(let R=0;R<Pi;++R){const K=R/_,S=Math.exp(-K*K/2);f.push(S),R===0?y+=S:R<p&&(y+=2*S)}for(let R=0;R<f.length;R++)f[R]=f[R]/y;d.envMap.value=e.texture,d.samples.value=p,d.weights.value=f,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:x}=this;d.dTheta.value=g,d.mipInt.value=x-n;const b=this._sizeLods[r],L=3*b*(r>x-dr?r-x+dr:0),P=4*(this._cubeSize-b);ws(t,L,P,3*b,2*b),l.setRenderTarget(t),l.render(h,qo)}}function $m(i){const e=[],t=[],n=[];let r=i;const s=i-dr+1+lc.length;for(let a=0;a<s;a++){const o=Math.pow(2,r);t.push(o);let l=1/o;a>i-dr?l=lc[a-i+dr-1]:a===0&&(l=0),n.push(l);const c=1/(o-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],m=6,g=6,_=3,p=2,f=1,y=new Float32Array(_*g*m),x=new Float32Array(p*g*m),b=new Float32Array(f*g*m);for(let P=0;P<m;P++){const R=P%3*2/3-1,K=P>2?0:-1,S=[R,K,0,R+2/3,K,0,R+2/3,K+1,0,R,K,0,R+2/3,K+1,0,R,K+1,0];y.set(S,_*g*P),x.set(d,p*g*P);const A=[P,P,P,P,P,P];b.set(A,f*g*P)}const L=new jt;L.setAttribute("position",new hn(y,_)),L.setAttribute("uv",new hn(x,p)),L.setAttribute("faceIndex",new hn(b,f)),e.push(L),r>dr&&r--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function hc(i,e,t){const n=new Fi(i,e,t);return n.texture.mapping=ao,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ws(i,e,t,n,r){i.viewport.set(e,t,n,r),i.scissor.set(e,t,n,r)}function Km(i,e,t){const n=new Float32Array(Pi),r=new w(0,1,0);return new Oi({name:"SphericalGaussianBlur",defines:{n:Pi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:qa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:di,depthTest:!1,depthWrite:!1})}function dc(){return new Oi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:qa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:di,depthTest:!1,depthWrite:!1})}function fc(){return new Oi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:qa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:di,depthTest:!1,depthWrite:!1})}function qa(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Zm(i){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){const l=o.mapping,c=l===ga||l===_a,u=l===Mr||l===Sr;if(c||u)if(o.isRenderTargetTexture&&o.needsPMREMUpdate===!0){o.needsPMREMUpdate=!1;let h=e.get(o);return t===null&&(t=new ya(i)),h=c?t.fromEquirectangular(o,h):t.fromCubemap(o,h),e.set(o,h),h.texture}else{if(e.has(o))return e.get(o).texture;{const h=o.image;if(c&&h&&h.height>0||u&&h&&r(h)){t===null&&(t=new ya(i));const d=c?t.fromEquirectangular(o):t.fromCubemap(o);return e.set(o,d),o.addEventListener("dispose",s),d.texture}else return null}}}return o}function r(o){let l=0;const c=6;for(let u=0;u<c;u++)o[u]!==void 0&&l++;return l===c}function s(o){const l=o.target;l.removeEventListener("dispose",s);const c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function Jm(i){const e={};function t(n){if(e[n]!==void 0)return e[n];let r;switch(n){case"WEBGL_depth_texture":r=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=i.getExtension(n)}return e[n]=r,r}return{has:function(n){return t(n)!==null},init:function(n){n.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(n){const r=t(n);return r===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),r}}}function Qm(i,e,t,n){const r={},s=new WeakMap;function a(h){const d=h.target;d.index!==null&&e.remove(d.index);for(const g in d.attributes)e.remove(d.attributes[g]);for(const g in d.morphAttributes){const _=d.morphAttributes[g];for(let p=0,f=_.length;p<f;p++)e.remove(_[p])}d.removeEventListener("dispose",a),delete r[d.id];const m=s.get(d);m&&(e.remove(m),s.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(h,d){return r[d.id]===!0||(d.addEventListener("dispose",a),r[d.id]=!0,t.memory.geometries++),d}function l(h){const d=h.attributes;for(const g in d)e.update(d[g],i.ARRAY_BUFFER);const m=h.morphAttributes;for(const g in m){const _=m[g];for(let p=0,f=_.length;p<f;p++)e.update(_[p],i.ARRAY_BUFFER)}}function c(h){const d=[],m=h.index,g=h.attributes.position;let _=0;if(m!==null){const y=m.array;_=m.version;for(let x=0,b=y.length;x<b;x+=3){const L=y[x+0],P=y[x+1],R=y[x+2];d.push(L,P,P,R,R,L)}}else if(g!==void 0){const y=g.array;_=g.version;for(let x=0,b=y.length/3-1;x<b;x+=3){const L=x+0,P=x+1,R=x+2;d.push(L,P,P,R,R,L)}}else return;const p=new(Du(d)?Bu:Ou)(d,1);p.version=_;const f=s.get(h);f&&e.remove(f),s.set(h,p)}function u(h){const d=s.get(h);if(d){const m=h.index;m!==null&&d.version<m.version&&c(h)}else c(h);return s.get(h)}return{get:o,update:l,getWireframeAttribute:u}}function eg(i,e,t,n){const r=n.isWebGL2;let s;function a(m){s=m}let o,l;function c(m){o=m.type,l=m.bytesPerElement}function u(m,g){i.drawElements(s,g,o,m*l),t.update(g,s,1)}function h(m,g,_){if(_===0)return;let p,f;if(r)p=i,f="drawElementsInstanced";else if(p=e.get("ANGLE_instanced_arrays"),f="drawElementsInstancedANGLE",p===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[f](s,g,o,m*l,_),t.update(g,s,_)}function d(m,g,_){if(_===0)return;const p=e.get("WEBGL_multi_draw");if(p===null)for(let f=0;f<_;f++)this.render(m[f]/l,g[f]);else{p.multiDrawElementsWEBGL(s,g,0,o,m,0,_);let f=0;for(let y=0;y<_;y++)f+=g[y];t.update(f,s,1)}}this.setMode=a,this.setIndex=c,this.render=u,this.renderInstances=h,this.renderMultiDraw=d}function tg(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(s/3);break;case i.LINES:t.lines+=o*(s/2);break;case i.LINE_STRIP:t.lines+=o*(s-1);break;case i.LINE_LOOP:t.lines+=o*s;break;case i.POINTS:t.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:n}}function ng(i,e){return i[0]-e[0]}function ig(i,e){return Math.abs(e[1])-Math.abs(i[1])}function rg(i,e,t){const n={},r=new Float32Array(8),s=new WeakMap,a=new gt,o=[];for(let c=0;c<8;c++)o[c]=[c,0];function l(c,u,h){const d=c.morphTargetInfluences;if(e.isWebGL2===!0){const g=u.morphAttributes.position||u.morphAttributes.normal||u.morphAttributes.color,_=g!==void 0?g.length:0;let p=s.get(u);if(p===void 0||p.count!==_){let z=function(){oe.dispose(),s.delete(u),u.removeEventListener("dispose",z)};var m=z;p!==void 0&&p.texture.dispose();const x=u.morphAttributes.position!==void 0,b=u.morphAttributes.normal!==void 0,L=u.morphAttributes.color!==void 0,P=u.morphAttributes.position||[],R=u.morphAttributes.normal||[],K=u.morphAttributes.color||[];let S=0;x===!0&&(S=1),b===!0&&(S=2),L===!0&&(S=3);let A=u.attributes.position.count*S,k=1;A>e.maxTextureSize&&(k=Math.ceil(A/e.maxTextureSize),A=e.maxTextureSize);const X=new Float32Array(A*k*4*_),oe=new Nu(X,A,k,_);oe.type=ai,oe.needsUpdate=!0;const D=S*4;for(let V=0;V<_;V++){const j=P[V],Y=R[V],q=K[V],$=A*k*4*V;for(let se=0;se<j.count;se++){const ae=se*D;x===!0&&(a.fromBufferAttribute(j,se),X[$+ae+0]=a.x,X[$+ae+1]=a.y,X[$+ae+2]=a.z,X[$+ae+3]=0),b===!0&&(a.fromBufferAttribute(Y,se),X[$+ae+4]=a.x,X[$+ae+5]=a.y,X[$+ae+6]=a.z,X[$+ae+7]=0),L===!0&&(a.fromBufferAttribute(q,se),X[$+ae+8]=a.x,X[$+ae+9]=a.y,X[$+ae+10]=a.z,X[$+ae+11]=q.itemSize===4?a.w:1)}}p={count:_,texture:oe,size:new Ne(A,k)},s.set(u,p),u.addEventListener("dispose",z)}let f=0;for(let x=0;x<d.length;x++)f+=d[x];const y=u.morphTargetsRelative?1:1-f;h.getUniforms().setValue(i,"morphTargetBaseInfluence",y),h.getUniforms().setValue(i,"morphTargetInfluences",d),h.getUniforms().setValue(i,"morphTargetsTexture",p.texture,t),h.getUniforms().setValue(i,"morphTargetsTextureSize",p.size)}else{const g=d===void 0?0:d.length;let _=n[u.id];if(_===void 0||_.length!==g){_=[];for(let b=0;b<g;b++)_[b]=[b,0];n[u.id]=_}for(let b=0;b<g;b++){const L=_[b];L[0]=b,L[1]=d[b]}_.sort(ig);for(let b=0;b<8;b++)b<g&&_[b][1]?(o[b][0]=_[b][0],o[b][1]=_[b][1]):(o[b][0]=Number.MAX_SAFE_INTEGER,o[b][1]=0);o.sort(ng);const p=u.morphAttributes.position,f=u.morphAttributes.normal;let y=0;for(let b=0;b<8;b++){const L=o[b],P=L[0],R=L[1];P!==Number.MAX_SAFE_INTEGER&&R?(p&&u.getAttribute("morphTarget"+b)!==p[P]&&u.setAttribute("morphTarget"+b,p[P]),f&&u.getAttribute("morphNormal"+b)!==f[P]&&u.setAttribute("morphNormal"+b,f[P]),r[b]=R,y+=R):(p&&u.hasAttribute("morphTarget"+b)===!0&&u.deleteAttribute("morphTarget"+b),f&&u.hasAttribute("morphNormal"+b)===!0&&u.deleteAttribute("morphNormal"+b),r[b]=0)}const x=u.morphTargetsRelative?1:1-y;h.getUniforms().setValue(i,"morphTargetBaseInfluence",x),h.getUniforms().setValue(i,"morphTargetInfluences",r)}}return{update:l}}function sg(i,e,t,n){let r=new WeakMap;function s(l){const c=n.render.frame,u=l.geometry,h=e.get(l,u);if(r.get(h)!==c&&(e.update(h),r.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),r.get(l)!==c&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;r.get(d)!==c&&(d.update(),r.set(d,c))}return h}function a(){r=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:s,dispose:a}}class Wu extends un{constructor(e,t,n,r,s,a,o,l,c,u){if(u=u!==void 0?u:Ui,u!==Ui&&u!==Er)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===Ui&&(n=oi),n===void 0&&u===Er&&(n=Ii),super(null,r,s,a,o,l,u,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:Jt,this.minFilter=l!==void 0?l:Jt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const Xu=new un,Yu=new Wu(1,1);Yu.compareFunction=Lu;const qu=new Nu,ju=new Vd,$u=new Gu,pc=[],mc=[],gc=new Float32Array(16),_c=new Float32Array(9),xc=new Float32Array(4);function Pr(i,e,t){const n=i[0];if(n<=0||n>0)return i;const r=e*t;let s=pc[r];if(s===void 0&&(s=new Float32Array(r),pc[r]=s),e!==0){n.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(s,o)}return s}function It(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Ut(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function uo(i,e){let t=mc[e];t===void 0&&(t=new Int32Array(e),mc[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function og(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function ag(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;i.uniform2fv(this.addr,e),Ut(t,e)}}function lg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(It(t,e))return;i.uniform3fv(this.addr,e),Ut(t,e)}}function cg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;i.uniform4fv(this.addr,e),Ut(t,e)}}function ug(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(It(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Ut(t,e)}else{if(It(t,n))return;xc.set(n),i.uniformMatrix2fv(this.addr,!1,xc),Ut(t,n)}}function hg(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(It(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Ut(t,e)}else{if(It(t,n))return;_c.set(n),i.uniformMatrix3fv(this.addr,!1,_c),Ut(t,n)}}function dg(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(It(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Ut(t,e)}else{if(It(t,n))return;gc.set(n),i.uniformMatrix4fv(this.addr,!1,gc),Ut(t,n)}}function fg(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function pg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;i.uniform2iv(this.addr,e),Ut(t,e)}}function mg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(It(t,e))return;i.uniform3iv(this.addr,e),Ut(t,e)}}function gg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;i.uniform4iv(this.addr,e),Ut(t,e)}}function _g(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function xg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;i.uniform2uiv(this.addr,e),Ut(t,e)}}function vg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(It(t,e))return;i.uniform3uiv(this.addr,e),Ut(t,e)}}function Mg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;i.uniform4uiv(this.addr,e),Ut(t,e)}}function Sg(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);const s=this.type===i.SAMPLER_2D_SHADOW?Yu:Xu;t.setTexture2D(e||s,r)}function Eg(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture3D(e||ju,r)}function yg(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTextureCube(e||$u,r)}function bg(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture2DArray(e||qu,r)}function Tg(i){switch(i){case 5126:return og;case 35664:return ag;case 35665:return lg;case 35666:return cg;case 35674:return ug;case 35675:return hg;case 35676:return dg;case 5124:case 35670:return fg;case 35667:case 35671:return pg;case 35668:case 35672:return mg;case 35669:case 35673:return gg;case 5125:return _g;case 36294:return xg;case 36295:return vg;case 36296:return Mg;case 35678:case 36198:case 36298:case 36306:case 35682:return Sg;case 35679:case 36299:case 36307:return Eg;case 35680:case 36300:case 36308:case 36293:return yg;case 36289:case 36303:case 36311:case 36292:return bg}}function Ag(i,e){i.uniform1fv(this.addr,e)}function wg(i,e){const t=Pr(e,this.size,2);i.uniform2fv(this.addr,t)}function Rg(i,e){const t=Pr(e,this.size,3);i.uniform3fv(this.addr,t)}function Cg(i,e){const t=Pr(e,this.size,4);i.uniform4fv(this.addr,t)}function Pg(i,e){const t=Pr(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Lg(i,e){const t=Pr(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Dg(i,e){const t=Pr(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Ig(i,e){i.uniform1iv(this.addr,e)}function Ug(i,e){i.uniform2iv(this.addr,e)}function Ng(i,e){i.uniform3iv(this.addr,e)}function Fg(i,e){i.uniform4iv(this.addr,e)}function Og(i,e){i.uniform1uiv(this.addr,e)}function Bg(i,e){i.uniform2uiv(this.addr,e)}function zg(i,e){i.uniform3uiv(this.addr,e)}function Hg(i,e){i.uniform4uiv(this.addr,e)}function Gg(i,e,t){const n=this.cache,r=e.length,s=uo(t,r);It(n,s)||(i.uniform1iv(this.addr,s),Ut(n,s));for(let a=0;a!==r;++a)t.setTexture2D(e[a]||Xu,s[a])}function Vg(i,e,t){const n=this.cache,r=e.length,s=uo(t,r);It(n,s)||(i.uniform1iv(this.addr,s),Ut(n,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||ju,s[a])}function kg(i,e,t){const n=this.cache,r=e.length,s=uo(t,r);It(n,s)||(i.uniform1iv(this.addr,s),Ut(n,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||$u,s[a])}function Wg(i,e,t){const n=this.cache,r=e.length,s=uo(t,r);It(n,s)||(i.uniform1iv(this.addr,s),Ut(n,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||qu,s[a])}function Xg(i){switch(i){case 5126:return Ag;case 35664:return wg;case 35665:return Rg;case 35666:return Cg;case 35674:return Pg;case 35675:return Lg;case 35676:return Dg;case 5124:case 35670:return Ig;case 35667:case 35671:return Ug;case 35668:case 35672:return Ng;case 35669:case 35673:return Fg;case 5125:return Og;case 36294:return Bg;case 36295:return zg;case 36296:return Hg;case 35678:case 36198:case 36298:case 36306:case 35682:return Gg;case 35679:case 36299:case 36307:return Vg;case 35680:case 36300:case 36308:case 36293:return kg;case 36289:case 36303:case 36311:case 36292:return Wg}}class Yg{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Tg(t.type)}}class qg{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Xg(t.type)}}class jg{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],n)}}}const Zo=/(\w+)(\])?(\[|\.)?/g;function vc(i,e){i.seq.push(e),i.map[e.id]=e}function $g(i,e,t){const n=i.name,r=n.length;for(Zo.lastIndex=0;;){const s=Zo.exec(n),a=Zo.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){vc(t,c===void 0?new Yg(o,i,e):new qg(o,i,e));break}else{let h=t.map[o];h===void 0&&(h=new jg(o),vc(t,h)),t=h}}}class Bs{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){const s=e.getActiveUniform(t,r),a=e.getUniformLocation(t,s.name);$g(s,a,this)}}setValue(e,t,n,r){const s=this.map[t];s!==void 0&&s.setValue(e,n,r)}setOptional(e,t,n){const r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){const n=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&n.push(a)}return n}}function Mc(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const Kg=37297;let Zg=0;function Jg(i,e){const t=i.split(`
`),n=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}function Qg(i){const e=st.getPrimaries(st.workingColorSpace),t=st.getPrimaries(i);let n;switch(e===t?n="":e===Ys&&t===Xs?n="LinearDisplayP3ToLinearSRGB":e===Xs&&t===Ys&&(n="LinearSRGBToLinearDisplayP3"),i){case $n:case lo:return[n,"LinearTransferOETF"];case Lt:case ka:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[n,"LinearTransferOETF"]}}function Sc(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),r=i.getShaderInfoLog(e).trim();if(n&&r==="")return"";const s=/ERROR: 0:(\d+)/.exec(r);if(s){const a=parseInt(s[1]);return t.toUpperCase()+`

`+r+`

`+Jg(i.getShaderSource(e),a)}else return r}function e_(i,e){const t=Qg(e);return`vec4 ${i}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function t_(i,e){let t;switch(e){case hd:t="Linear";break;case dd:t="Reinhard";break;case fd:t="OptimizedCineon";break;case Mu:t="ACESFilmic";break;case md:t="AgX";break;case pd:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function n_(i){return[i.extensionDerivatives||i.envMapCubeUVHeight||i.bumpMap||i.normalMapTangentSpace||i.clearcoatNormalMap||i.flatShading||i.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(i.extensionFragDepth||i.logarithmicDepthBuffer)&&i.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",i.extensionDrawBuffers&&i.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(i.extensionShaderTextureLOD||i.envMap||i.transmission)&&i.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(fr).join(`
`)}function i_(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(fr).join(`
`)}function r_(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function s_(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const s=i.getActiveAttrib(e,r),a=s.name;let o=1;s.type===i.FLOAT_MAT2&&(o=2),s.type===i.FLOAT_MAT3&&(o=3),s.type===i.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function fr(i){return i!==""}function Ec(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function yc(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const o_=/^[ \t]*#include +<([\w\d./]+)>/gm;function ba(i){return i.replace(o_,l_)}const a_=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function l_(i,e){let t=We[e];if(t===void 0){const n=a_.get(e);if(n!==void 0)t=We[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return ba(t)}const c_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function bc(i){return i.replace(c_,u_)}function u_(i,e,t,n){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Tc(i){let e="precision "+i.precision+` float;
precision `+i.precision+" int;";return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function h_(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===xu?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===zh?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Wn&&(e="SHADOWMAP_TYPE_VSM"),e}function d_(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Mr:case Sr:e="ENVMAP_TYPE_CUBE";break;case ao:e="ENVMAP_TYPE_CUBE_UV";break}return e}function f_(i){let e="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Sr:e="ENVMAP_MODE_REFRACTION";break}return e}function p_(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case vu:e="ENVMAP_BLENDING_MULTIPLY";break;case cd:e="ENVMAP_BLENDING_MIX";break;case ud:e="ENVMAP_BLENDING_ADD";break}return e}function m_(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:n,maxMip:t}}function g_(i,e,t,n){const r=i.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=h_(t),c=d_(t),u=f_(t),h=p_(t),d=m_(t),m=t.isWebGL2?"":n_(t),g=i_(t),_=r_(s),p=r.createProgram();let f,y,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(fr).join(`
`),f.length>0&&(f+=`
`),y=[m,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(fr).join(`
`),y.length>0&&(y+=`
`)):(f=[Tc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(fr).join(`
`),y=[m,Tc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==fi?"#define TONE_MAPPING":"",t.toneMapping!==fi?We.tonemapping_pars_fragment:"",t.toneMapping!==fi?t_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",We.colorspace_pars_fragment,e_("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(fr).join(`
`)),a=ba(a),a=Ec(a,t),a=yc(a,t),o=ba(o),o=Ec(o,t),o=yc(o,t),a=bc(a),o=bc(o),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,f=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,y=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===Wl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Wl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+y);const b=x+f+a,L=x+y+o,P=Mc(r,r.VERTEX_SHADER,b),R=Mc(r,r.FRAGMENT_SHADER,L);r.attachShader(p,P),r.attachShader(p,R),t.index0AttributeName!==void 0?r.bindAttribLocation(p,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(p,0,"position"),r.linkProgram(p);function K(X){if(i.debug.checkShaderErrors){const oe=r.getProgramInfoLog(p).trim(),D=r.getShaderInfoLog(P).trim(),z=r.getShaderInfoLog(R).trim();let V=!0,j=!0;if(r.getProgramParameter(p,r.LINK_STATUS)===!1)if(V=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,p,P,R);else{const Y=Sc(r,P,"vertex"),q=Sc(r,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(p,r.VALIDATE_STATUS)+`

Program Info Log: `+oe+`
`+Y+`
`+q)}else oe!==""?console.warn("THREE.WebGLProgram: Program Info Log:",oe):(D===""||z==="")&&(j=!1);j&&(X.diagnostics={runnable:V,programLog:oe,vertexShader:{log:D,prefix:f},fragmentShader:{log:z,prefix:y}})}r.deleteShader(P),r.deleteShader(R),S=new Bs(r,p),A=s_(r,p)}let S;this.getUniforms=function(){return S===void 0&&K(this),S};let A;this.getAttributes=function(){return A===void 0&&K(this),A};let k=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return k===!1&&(k=r.getProgramParameter(p,Kg)),k},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(p),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Zg++,this.cacheKey=e,this.usedTimes=1,this.program=p,this.vertexShader=P,this.fragmentShader=R,this}let __=0;class x_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new v_(e),t.set(e,n)),n}}class v_{constructor(e){this.id=__++,this.code=e,this.usedTimes=0}}function M_(i,e,t,n,r,s,a){const o=new Wa,l=new x_,c=[],u=r.isWebGL2,h=r.logarithmicDepthBuffer,d=r.vertexTextures;let m=r.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(S){return S===0?"uv":`uv${S}`}function p(S,A,k,X,oe){const D=X.fog,z=oe.geometry,V=S.isMeshStandardMaterial?X.environment:null,j=(S.isMeshStandardMaterial?t:e).get(S.envMap||V),Y=j&&j.mapping===ao?j.image.height:null,q=g[S.type];S.precision!==null&&(m=r.getMaxPrecision(S.precision),m!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",m,"instead."));const $=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,se=$!==void 0?$.length:0;let ae=0;z.morphAttributes.position!==void 0&&(ae=1),z.morphAttributes.normal!==void 0&&(ae=2),z.morphAttributes.color!==void 0&&(ae=3);let G,Z,he,Se;if(q){const yt=Dn[q];G=yt.vertexShader,Z=yt.fragmentShader}else G=S.vertexShader,Z=S.fragmentShader,l.update(S),he=l.getVertexShaderID(S),Se=l.getFragmentShaderID(S);const ve=i.getRenderTarget(),Fe=oe.isInstancedMesh===!0,Oe=oe.isBatchedMesh===!0,we=!!S.map,Ze=!!S.matcap,F=!!j,Ot=!!S.aoMap,be=!!S.lightMap,De=!!S.bumpMap,ge=!!S.normalMap,ut=!!S.displacementMap,He=!!S.emissiveMap,E=!!S.metalnessMap,v=!!S.roughnessMap,N=S.anisotropy>0,te=S.clearcoat>0,Q=S.iridescence>0,ne=S.sheen>0,xe=S.transmission>0,ue=N&&!!S.anisotropyMap,me=te&&!!S.clearcoatMap,Ae=te&&!!S.clearcoatNormalMap,Ge=te&&!!S.clearcoatRoughnessMap,J=Q&&!!S.iridescenceMap,it=Q&&!!S.iridescenceThicknessMap,Xe=ne&&!!S.sheenColorMap,Ie=ne&&!!S.sheenRoughnessMap,ye=!!S.specularMap,de=!!S.specularColorMap,T=!!S.specularIntensityMap,ie=xe&&!!S.transmissionMap,Me=xe&&!!S.thicknessMap,pe=!!S.gradientMap,ee=!!S.alphaMap,C=S.alphaTest>0,re=!!S.alphaHash,ce=!!S.extensions,Re=!!z.attributes.uv1,Te=!!z.attributes.uv2,Je=!!z.attributes.uv3;let Qe=fi;return S.toneMapped&&(ve===null||ve.isXRRenderTarget===!0)&&(Qe=i.toneMapping),{isWebGL2:u,shaderID:q,shaderType:S.type,shaderName:S.name,vertexShader:G,fragmentShader:Z,defines:S.defines,customVertexShaderID:he,customFragmentShaderID:Se,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:m,batching:Oe,instancing:Fe,instancingColor:Fe&&oe.instanceColor!==null,supportsVertexTextures:d,outputColorSpace:ve===null?i.outputColorSpace:ve.isXRRenderTarget===!0?ve.texture.colorSpace:$n,map:we,matcap:Ze,envMap:F,envMapMode:F&&j.mapping,envMapCubeUVHeight:Y,aoMap:Ot,lightMap:be,bumpMap:De,normalMap:ge,displacementMap:d&&ut,emissiveMap:He,normalMapObjectSpace:ge&&S.normalMapType===wd,normalMapTangentSpace:ge&&S.normalMapType===Pu,metalnessMap:E,roughnessMap:v,anisotropy:N,anisotropyMap:ue,clearcoat:te,clearcoatMap:me,clearcoatNormalMap:Ae,clearcoatRoughnessMap:Ge,iridescence:Q,iridescenceMap:J,iridescenceThicknessMap:it,sheen:ne,sheenColorMap:Xe,sheenRoughnessMap:Ie,specularMap:ye,specularColorMap:de,specularIntensityMap:T,transmission:xe,transmissionMap:ie,thicknessMap:Me,gradientMap:pe,opaque:S.transparent===!1&&S.blending===gr,alphaMap:ee,alphaTest:C,alphaHash:re,combine:S.combine,mapUv:we&&_(S.map.channel),aoMapUv:Ot&&_(S.aoMap.channel),lightMapUv:be&&_(S.lightMap.channel),bumpMapUv:De&&_(S.bumpMap.channel),normalMapUv:ge&&_(S.normalMap.channel),displacementMapUv:ut&&_(S.displacementMap.channel),emissiveMapUv:He&&_(S.emissiveMap.channel),metalnessMapUv:E&&_(S.metalnessMap.channel),roughnessMapUv:v&&_(S.roughnessMap.channel),anisotropyMapUv:ue&&_(S.anisotropyMap.channel),clearcoatMapUv:me&&_(S.clearcoatMap.channel),clearcoatNormalMapUv:Ae&&_(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ge&&_(S.clearcoatRoughnessMap.channel),iridescenceMapUv:J&&_(S.iridescenceMap.channel),iridescenceThicknessMapUv:it&&_(S.iridescenceThicknessMap.channel),sheenColorMapUv:Xe&&_(S.sheenColorMap.channel),sheenRoughnessMapUv:Ie&&_(S.sheenRoughnessMap.channel),specularMapUv:ye&&_(S.specularMap.channel),specularColorMapUv:de&&_(S.specularColorMap.channel),specularIntensityMapUv:T&&_(S.specularIntensityMap.channel),transmissionMapUv:ie&&_(S.transmissionMap.channel),thicknessMapUv:Me&&_(S.thicknessMap.channel),alphaMapUv:ee&&_(S.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(ge||N),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,vertexUv1s:Re,vertexUv2s:Te,vertexUv3s:Je,pointsUvs:oe.isPoints===!0&&!!z.attributes.uv&&(we||ee),fog:!!D,useFog:S.fog===!0,fogExp2:D&&D.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:h,skinning:oe.isSkinnedMesh===!0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:se,morphTextureStride:ae,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:S.dithering,shadowMapEnabled:i.shadowMap.enabled&&k.length>0,shadowMapType:i.shadowMap.type,toneMapping:Qe,useLegacyLights:i._useLegacyLights,decodeVideoTexture:we&&S.map.isVideoTexture===!0&&st.getTransfer(S.map.colorSpace)===dt,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Rn,flipSided:S.side===Qt,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionDerivatives:ce&&S.extensions.derivatives===!0,extensionFragDepth:ce&&S.extensions.fragDepth===!0,extensionDrawBuffers:ce&&S.extensions.drawBuffers===!0,extensionShaderTextureLOD:ce&&S.extensions.shaderTextureLOD===!0,extensionClipCullDistance:ce&&S.extensions.clipCullDistance&&n.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:u||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||n.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()}}function f(S){const A=[];if(S.shaderID?A.push(S.shaderID):(A.push(S.customVertexShaderID),A.push(S.customFragmentShaderID)),S.defines!==void 0)for(const k in S.defines)A.push(k),A.push(S.defines[k]);return S.isRawShaderMaterial===!1&&(y(A,S),x(A,S),A.push(i.outputColorSpace)),A.push(S.customProgramCacheKey),A.join()}function y(S,A){S.push(A.precision),S.push(A.outputColorSpace),S.push(A.envMapMode),S.push(A.envMapCubeUVHeight),S.push(A.mapUv),S.push(A.alphaMapUv),S.push(A.lightMapUv),S.push(A.aoMapUv),S.push(A.bumpMapUv),S.push(A.normalMapUv),S.push(A.displacementMapUv),S.push(A.emissiveMapUv),S.push(A.metalnessMapUv),S.push(A.roughnessMapUv),S.push(A.anisotropyMapUv),S.push(A.clearcoatMapUv),S.push(A.clearcoatNormalMapUv),S.push(A.clearcoatRoughnessMapUv),S.push(A.iridescenceMapUv),S.push(A.iridescenceThicknessMapUv),S.push(A.sheenColorMapUv),S.push(A.sheenRoughnessMapUv),S.push(A.specularMapUv),S.push(A.specularColorMapUv),S.push(A.specularIntensityMapUv),S.push(A.transmissionMapUv),S.push(A.thicknessMapUv),S.push(A.combine),S.push(A.fogExp2),S.push(A.sizeAttenuation),S.push(A.morphTargetsCount),S.push(A.morphAttributeCount),S.push(A.numDirLights),S.push(A.numPointLights),S.push(A.numSpotLights),S.push(A.numSpotLightMaps),S.push(A.numHemiLights),S.push(A.numRectAreaLights),S.push(A.numDirLightShadows),S.push(A.numPointLightShadows),S.push(A.numSpotLightShadows),S.push(A.numSpotLightShadowsWithMaps),S.push(A.numLightProbes),S.push(A.shadowMapType),S.push(A.toneMapping),S.push(A.numClippingPlanes),S.push(A.numClipIntersection),S.push(A.depthPacking)}function x(S,A){o.disableAll(),A.isWebGL2&&o.enable(0),A.supportsVertexTextures&&o.enable(1),A.instancing&&o.enable(2),A.instancingColor&&o.enable(3),A.matcap&&o.enable(4),A.envMap&&o.enable(5),A.normalMapObjectSpace&&o.enable(6),A.normalMapTangentSpace&&o.enable(7),A.clearcoat&&o.enable(8),A.iridescence&&o.enable(9),A.alphaTest&&o.enable(10),A.vertexColors&&o.enable(11),A.vertexAlphas&&o.enable(12),A.vertexUv1s&&o.enable(13),A.vertexUv2s&&o.enable(14),A.vertexUv3s&&o.enable(15),A.vertexTangents&&o.enable(16),A.anisotropy&&o.enable(17),A.alphaHash&&o.enable(18),A.batching&&o.enable(19),S.push(o.mask),o.disableAll(),A.fog&&o.enable(0),A.useFog&&o.enable(1),A.flatShading&&o.enable(2),A.logarithmicDepthBuffer&&o.enable(3),A.skinning&&o.enable(4),A.morphTargets&&o.enable(5),A.morphNormals&&o.enable(6),A.morphColors&&o.enable(7),A.premultipliedAlpha&&o.enable(8),A.shadowMapEnabled&&o.enable(9),A.useLegacyLights&&o.enable(10),A.doubleSided&&o.enable(11),A.flipSided&&o.enable(12),A.useDepthPacking&&o.enable(13),A.dithering&&o.enable(14),A.transmission&&o.enable(15),A.sheen&&o.enable(16),A.opaque&&o.enable(17),A.pointsUvs&&o.enable(18),A.decodeVideoTexture&&o.enable(19),S.push(o.mask)}function b(S){const A=g[S.type];let k;if(A){const X=Dn[A];k=tf.clone(X.uniforms)}else k=S.uniforms;return k}function L(S,A){let k;for(let X=0,oe=c.length;X<oe;X++){const D=c[X];if(D.cacheKey===A){k=D,++k.usedTimes;break}}return k===void 0&&(k=new g_(i,A,S,s),c.push(k)),k}function P(S){if(--S.usedTimes===0){const A=c.indexOf(S);c[A]=c[c.length-1],c.pop(),S.destroy()}}function R(S){l.remove(S)}function K(){l.dispose()}return{getParameters:p,getProgramCacheKey:f,getUniforms:b,acquireProgram:L,releaseProgram:P,releaseShaderCache:R,programs:c,dispose:K}}function S_(){let i=new WeakMap;function e(s){let a=i.get(s);return a===void 0&&(a={},i.set(s,a)),a}function t(s){i.delete(s)}function n(s,a,o){i.get(s)[a]=o}function r(){i=new WeakMap}return{get:e,remove:t,update:n,dispose:r}}function E_(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function Ac(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function wc(){const i=[];let e=0;const t=[],n=[],r=[];function s(){e=0,t.length=0,n.length=0,r.length=0}function a(h,d,m,g,_,p){let f=i[e];return f===void 0?(f={id:h.id,object:h,geometry:d,material:m,groupOrder:g,renderOrder:h.renderOrder,z:_,group:p},i[e]=f):(f.id=h.id,f.object=h,f.geometry=d,f.material=m,f.groupOrder=g,f.renderOrder=h.renderOrder,f.z=_,f.group=p),e++,f}function o(h,d,m,g,_,p){const f=a(h,d,m,g,_,p);m.transmission>0?n.push(f):m.transparent===!0?r.push(f):t.push(f)}function l(h,d,m,g,_,p){const f=a(h,d,m,g,_,p);m.transmission>0?n.unshift(f):m.transparent===!0?r.unshift(f):t.unshift(f)}function c(h,d){t.length>1&&t.sort(h||E_),n.length>1&&n.sort(d||Ac),r.length>1&&r.sort(d||Ac)}function u(){for(let h=e,d=i.length;h<d;h++){const m=i[h];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:n,transparent:r,init:s,push:o,unshift:l,finish:u,sort:c}}function y_(){let i=new WeakMap;function e(n,r){const s=i.get(n);let a;return s===void 0?(a=new wc,i.set(n,[a])):r>=s.length?(a=new wc,s.push(a)):a=s[r],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function b_(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new w,color:new je};break;case"SpotLight":t={position:new w,direction:new w,color:new je,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new w,color:new je,distance:0,decay:0};break;case"HemisphereLight":t={direction:new w,skyColor:new je,groundColor:new je};break;case"RectAreaLight":t={color:new je,position:new w,halfWidth:new w,halfHeight:new w};break}return i[e.id]=t,t}}}function T_(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ne};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ne};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ne,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let A_=0;function w_(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function R_(i,e){const t=new b_,n=T_(),r={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let u=0;u<9;u++)r.probe.push(new w);const s=new w,a=new at,o=new at;function l(u,h){let d=0,m=0,g=0;for(let X=0;X<9;X++)r.probe[X].set(0,0,0);let _=0,p=0,f=0,y=0,x=0,b=0,L=0,P=0,R=0,K=0,S=0;u.sort(w_);const A=h===!0?Math.PI:1;for(let X=0,oe=u.length;X<oe;X++){const D=u[X],z=D.color,V=D.intensity,j=D.distance,Y=D.shadow&&D.shadow.map?D.shadow.map.texture:null;if(D.isAmbientLight)d+=z.r*V*A,m+=z.g*V*A,g+=z.b*V*A;else if(D.isLightProbe){for(let q=0;q<9;q++)r.probe[q].addScaledVector(D.sh.coefficients[q],V);S++}else if(D.isDirectionalLight){const q=t.get(D);if(q.color.copy(D.color).multiplyScalar(D.intensity*A),D.castShadow){const $=D.shadow,se=n.get(D);se.shadowBias=$.bias,se.shadowNormalBias=$.normalBias,se.shadowRadius=$.radius,se.shadowMapSize=$.mapSize,r.directionalShadow[_]=se,r.directionalShadowMap[_]=Y,r.directionalShadowMatrix[_]=D.shadow.matrix,b++}r.directional[_]=q,_++}else if(D.isSpotLight){const q=t.get(D);q.position.setFromMatrixPosition(D.matrixWorld),q.color.copy(z).multiplyScalar(V*A),q.distance=j,q.coneCos=Math.cos(D.angle),q.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),q.decay=D.decay,r.spot[f]=q;const $=D.shadow;if(D.map&&(r.spotLightMap[R]=D.map,R++,$.updateMatrices(D),D.castShadow&&K++),r.spotLightMatrix[f]=$.matrix,D.castShadow){const se=n.get(D);se.shadowBias=$.bias,se.shadowNormalBias=$.normalBias,se.shadowRadius=$.radius,se.shadowMapSize=$.mapSize,r.spotShadow[f]=se,r.spotShadowMap[f]=Y,P++}f++}else if(D.isRectAreaLight){const q=t.get(D);q.color.copy(z).multiplyScalar(V),q.halfWidth.set(D.width*.5,0,0),q.halfHeight.set(0,D.height*.5,0),r.rectArea[y]=q,y++}else if(D.isPointLight){const q=t.get(D);if(q.color.copy(D.color).multiplyScalar(D.intensity*A),q.distance=D.distance,q.decay=D.decay,D.castShadow){const $=D.shadow,se=n.get(D);se.shadowBias=$.bias,se.shadowNormalBias=$.normalBias,se.shadowRadius=$.radius,se.shadowMapSize=$.mapSize,se.shadowCameraNear=$.camera.near,se.shadowCameraFar=$.camera.far,r.pointShadow[p]=se,r.pointShadowMap[p]=Y,r.pointShadowMatrix[p]=D.shadow.matrix,L++}r.point[p]=q,p++}else if(D.isHemisphereLight){const q=t.get(D);q.skyColor.copy(D.color).multiplyScalar(V*A),q.groundColor.copy(D.groundColor).multiplyScalar(V*A),r.hemi[x]=q,x++}}y>0&&(e.isWebGL2?i.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=le.LTC_FLOAT_1,r.rectAreaLTC2=le.LTC_FLOAT_2):(r.rectAreaLTC1=le.LTC_HALF_1,r.rectAreaLTC2=le.LTC_HALF_2):i.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=le.LTC_FLOAT_1,r.rectAreaLTC2=le.LTC_FLOAT_2):i.has("OES_texture_half_float_linear")===!0?(r.rectAreaLTC1=le.LTC_HALF_1,r.rectAreaLTC2=le.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),r.ambient[0]=d,r.ambient[1]=m,r.ambient[2]=g;const k=r.hash;(k.directionalLength!==_||k.pointLength!==p||k.spotLength!==f||k.rectAreaLength!==y||k.hemiLength!==x||k.numDirectionalShadows!==b||k.numPointShadows!==L||k.numSpotShadows!==P||k.numSpotMaps!==R||k.numLightProbes!==S)&&(r.directional.length=_,r.spot.length=f,r.rectArea.length=y,r.point.length=p,r.hemi.length=x,r.directionalShadow.length=b,r.directionalShadowMap.length=b,r.pointShadow.length=L,r.pointShadowMap.length=L,r.spotShadow.length=P,r.spotShadowMap.length=P,r.directionalShadowMatrix.length=b,r.pointShadowMatrix.length=L,r.spotLightMatrix.length=P+R-K,r.spotLightMap.length=R,r.numSpotLightShadowsWithMaps=K,r.numLightProbes=S,k.directionalLength=_,k.pointLength=p,k.spotLength=f,k.rectAreaLength=y,k.hemiLength=x,k.numDirectionalShadows=b,k.numPointShadows=L,k.numSpotShadows=P,k.numSpotMaps=R,k.numLightProbes=S,r.version=A_++)}function c(u,h){let d=0,m=0,g=0,_=0,p=0;const f=h.matrixWorldInverse;for(let y=0,x=u.length;y<x;y++){const b=u[y];if(b.isDirectionalLight){const L=r.directional[d];L.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),L.direction.sub(s),L.direction.transformDirection(f),d++}else if(b.isSpotLight){const L=r.spot[g];L.position.setFromMatrixPosition(b.matrixWorld),L.position.applyMatrix4(f),L.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),L.direction.sub(s),L.direction.transformDirection(f),g++}else if(b.isRectAreaLight){const L=r.rectArea[_];L.position.setFromMatrixPosition(b.matrixWorld),L.position.applyMatrix4(f),o.identity(),a.copy(b.matrixWorld),a.premultiply(f),o.extractRotation(a),L.halfWidth.set(b.width*.5,0,0),L.halfHeight.set(0,b.height*.5,0),L.halfWidth.applyMatrix4(o),L.halfHeight.applyMatrix4(o),_++}else if(b.isPointLight){const L=r.point[m];L.position.setFromMatrixPosition(b.matrixWorld),L.position.applyMatrix4(f),m++}else if(b.isHemisphereLight){const L=r.hemi[p];L.direction.setFromMatrixPosition(b.matrixWorld),L.direction.transformDirection(f),p++}}}return{setup:l,setupView:c,state:r}}function Rc(i,e){const t=new R_(i,e),n=[],r=[];function s(){n.length=0,r.length=0}function a(h){n.push(h)}function o(h){r.push(h)}function l(h){t.setup(n,h)}function c(h){t.setupView(n,h)}return{init:s,state:{lightsArray:n,shadowsArray:r,lights:t},setupLights:l,setupLightsView:c,pushLight:a,pushShadow:o}}function C_(i,e){let t=new WeakMap;function n(s,a=0){const o=t.get(s);let l;return o===void 0?(l=new Rc(i,e),t.set(s,[l])):a>=o.length?(l=new Rc(i,e),o.push(l)):l=o[a],l}function r(){t=new WeakMap}return{get:n,dispose:r}}class P_ extends Cr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Td,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class L_ extends Cr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const D_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,I_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function U_(i,e,t){let n=new Xa;const r=new Ne,s=new Ne,a=new gt,o=new P_({depthPacking:Ad}),l=new L_,c={},u=t.maxTextureSize,h={[gi]:Qt,[Qt]:gi,[Rn]:Rn},d=new Oi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ne},radius:{value:4}},vertexShader:D_,fragmentShader:I_}),m=d.clone();m.defines.HORIZONTAL_PASS=1;const g=new jt;g.setAttribute("position",new hn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new ct(g,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=xu;let f=this.type;this.render=function(P,R,K){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||P.length===0)return;const S=i.getRenderTarget(),A=i.getActiveCubeFace(),k=i.getActiveMipmapLevel(),X=i.state;X.setBlending(di),X.buffers.color.setClear(1,1,1,1),X.buffers.depth.setTest(!0),X.setScissorTest(!1);const oe=f!==Wn&&this.type===Wn,D=f===Wn&&this.type!==Wn;for(let z=0,V=P.length;z<V;z++){const j=P[z],Y=j.shadow;if(Y===void 0){console.warn("THREE.WebGLShadowMap:",j,"has no shadow.");continue}if(Y.autoUpdate===!1&&Y.needsUpdate===!1)continue;r.copy(Y.mapSize);const q=Y.getFrameExtents();if(r.multiply(q),s.copy(Y.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/q.x),r.x=s.x*q.x,Y.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/q.y),r.y=s.y*q.y,Y.mapSize.y=s.y)),Y.map===null||oe===!0||D===!0){const se=this.type!==Wn?{minFilter:Jt,magFilter:Jt}:{};Y.map!==null&&Y.map.dispose(),Y.map=new Fi(r.x,r.y,se),Y.map.texture.name=j.name+".shadowMap",Y.camera.updateProjectionMatrix()}i.setRenderTarget(Y.map),i.clear();const $=Y.getViewportCount();for(let se=0;se<$;se++){const ae=Y.getViewport(se);a.set(s.x*ae.x,s.y*ae.y,s.x*ae.z,s.y*ae.w),X.viewport(a),Y.updateMatrices(j,se),n=Y.getFrustum(),b(R,K,Y.camera,j,this.type)}Y.isPointLightShadow!==!0&&this.type===Wn&&y(Y,K),Y.needsUpdate=!1}f=this.type,p.needsUpdate=!1,i.setRenderTarget(S,A,k)};function y(P,R){const K=e.update(_);d.defines.VSM_SAMPLES!==P.blurSamples&&(d.defines.VSM_SAMPLES=P.blurSamples,m.defines.VSM_SAMPLES=P.blurSamples,d.needsUpdate=!0,m.needsUpdate=!0),P.mapPass===null&&(P.mapPass=new Fi(r.x,r.y)),d.uniforms.shadow_pass.value=P.map.texture,d.uniforms.resolution.value=P.mapSize,d.uniforms.radius.value=P.radius,i.setRenderTarget(P.mapPass),i.clear(),i.renderBufferDirect(R,null,K,d,_,null),m.uniforms.shadow_pass.value=P.mapPass.texture,m.uniforms.resolution.value=P.mapSize,m.uniforms.radius.value=P.radius,i.setRenderTarget(P.map),i.clear(),i.renderBufferDirect(R,null,K,m,_,null)}function x(P,R,K,S){let A=null;const k=K.isPointLight===!0?P.customDistanceMaterial:P.customDepthMaterial;if(k!==void 0)A=k;else if(A=K.isPointLight===!0?l:o,i.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0){const X=A.uuid,oe=R.uuid;let D=c[X];D===void 0&&(D={},c[X]=D);let z=D[oe];z===void 0&&(z=A.clone(),D[oe]=z,R.addEventListener("dispose",L)),A=z}if(A.visible=R.visible,A.wireframe=R.wireframe,S===Wn?A.side=R.shadowSide!==null?R.shadowSide:R.side:A.side=R.shadowSide!==null?R.shadowSide:h[R.side],A.alphaMap=R.alphaMap,A.alphaTest=R.alphaTest,A.map=R.map,A.clipShadows=R.clipShadows,A.clippingPlanes=R.clippingPlanes,A.clipIntersection=R.clipIntersection,A.displacementMap=R.displacementMap,A.displacementScale=R.displacementScale,A.displacementBias=R.displacementBias,A.wireframeLinewidth=R.wireframeLinewidth,A.linewidth=R.linewidth,K.isPointLight===!0&&A.isMeshDistanceMaterial===!0){const X=i.properties.get(A);X.light=K}return A}function b(P,R,K,S,A){if(P.visible===!1)return;if(P.layers.test(R.layers)&&(P.isMesh||P.isLine||P.isPoints)&&(P.castShadow||P.receiveShadow&&A===Wn)&&(!P.frustumCulled||n.intersectsObject(P))){P.modelViewMatrix.multiplyMatrices(K.matrixWorldInverse,P.matrixWorld);const oe=e.update(P),D=P.material;if(Array.isArray(D)){const z=oe.groups;for(let V=0,j=z.length;V<j;V++){const Y=z[V],q=D[Y.materialIndex];if(q&&q.visible){const $=x(P,q,S,A);P.onBeforeShadow(i,P,R,K,oe,$,Y),i.renderBufferDirect(K,null,oe,$,P,Y),P.onAfterShadow(i,P,R,K,oe,$,Y)}}}else if(D.visible){const z=x(P,D,S,A);P.onBeforeShadow(i,P,R,K,oe,z,null),i.renderBufferDirect(K,null,oe,z,P,null),P.onAfterShadow(i,P,R,K,oe,z,null)}}const X=P.children;for(let oe=0,D=X.length;oe<D;oe++)b(X[oe],R,K,S,A)}function L(P){P.target.removeEventListener("dispose",L);for(const K in c){const S=c[K],A=P.target.uuid;A in S&&(S[A].dispose(),delete S[A])}}}function N_(i,e,t){const n=t.isWebGL2;function r(){let C=!1;const re=new gt;let ce=null;const Re=new gt(0,0,0,0);return{setMask:function(Te){ce!==Te&&!C&&(i.colorMask(Te,Te,Te,Te),ce=Te)},setLocked:function(Te){C=Te},setClear:function(Te,Je,Qe,St,yt){yt===!0&&(Te*=St,Je*=St,Qe*=St),re.set(Te,Je,Qe,St),Re.equals(re)===!1&&(i.clearColor(Te,Je,Qe,St),Re.copy(re))},reset:function(){C=!1,ce=null,Re.set(-1,0,0,0)}}}function s(){let C=!1,re=null,ce=null,Re=null;return{setTest:function(Te){Te?Oe(i.DEPTH_TEST):we(i.DEPTH_TEST)},setMask:function(Te){re!==Te&&!C&&(i.depthMask(Te),re=Te)},setFunc:function(Te){if(ce!==Te){switch(Te){case nd:i.depthFunc(i.NEVER);break;case id:i.depthFunc(i.ALWAYS);break;case rd:i.depthFunc(i.LESS);break;case ks:i.depthFunc(i.LEQUAL);break;case sd:i.depthFunc(i.EQUAL);break;case od:i.depthFunc(i.GEQUAL);break;case ad:i.depthFunc(i.GREATER);break;case ld:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}ce=Te}},setLocked:function(Te){C=Te},setClear:function(Te){Re!==Te&&(i.clearDepth(Te),Re=Te)},reset:function(){C=!1,re=null,ce=null,Re=null}}}function a(){let C=!1,re=null,ce=null,Re=null,Te=null,Je=null,Qe=null,St=null,yt=null;return{setTest:function(tt){C||(tt?Oe(i.STENCIL_TEST):we(i.STENCIL_TEST))},setMask:function(tt){re!==tt&&!C&&(i.stencilMask(tt),re=tt)},setFunc:function(tt,At,Ln){(ce!==tt||Re!==At||Te!==Ln)&&(i.stencilFunc(tt,At,Ln),ce=tt,Re=At,Te=Ln)},setOp:function(tt,At,Ln){(Je!==tt||Qe!==At||St!==Ln)&&(i.stencilOp(tt,At,Ln),Je=tt,Qe=At,St=Ln)},setLocked:function(tt){C=tt},setClear:function(tt){yt!==tt&&(i.clearStencil(tt),yt=tt)},reset:function(){C=!1,re=null,ce=null,Re=null,Te=null,Je=null,Qe=null,St=null,yt=null}}}const o=new r,l=new s,c=new a,u=new WeakMap,h=new WeakMap;let d={},m={},g=new WeakMap,_=[],p=null,f=!1,y=null,x=null,b=null,L=null,P=null,R=null,K=null,S=new je(0,0,0),A=0,k=!1,X=null,oe=null,D=null,z=null,V=null;const j=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let Y=!1,q=0;const $=i.getParameter(i.VERSION);$.indexOf("WebGL")!==-1?(q=parseFloat(/^WebGL (\d)/.exec($)[1]),Y=q>=1):$.indexOf("OpenGL ES")!==-1&&(q=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),Y=q>=2);let se=null,ae={};const G=i.getParameter(i.SCISSOR_BOX),Z=i.getParameter(i.VIEWPORT),he=new gt().fromArray(G),Se=new gt().fromArray(Z);function ve(C,re,ce,Re){const Te=new Uint8Array(4),Je=i.createTexture();i.bindTexture(C,Je),i.texParameteri(C,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(C,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Qe=0;Qe<ce;Qe++)n&&(C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY)?i.texImage3D(re,0,i.RGBA,1,1,Re,0,i.RGBA,i.UNSIGNED_BYTE,Te):i.texImage2D(re+Qe,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Te);return Je}const Fe={};Fe[i.TEXTURE_2D]=ve(i.TEXTURE_2D,i.TEXTURE_2D,1),Fe[i.TEXTURE_CUBE_MAP]=ve(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),n&&(Fe[i.TEXTURE_2D_ARRAY]=ve(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Fe[i.TEXTURE_3D]=ve(i.TEXTURE_3D,i.TEXTURE_3D,1,1)),o.setClear(0,0,0,1),l.setClear(1),c.setClear(0),Oe(i.DEPTH_TEST),l.setFunc(ks),He(!1),E(ul),Oe(i.CULL_FACE),ge(di);function Oe(C){d[C]!==!0&&(i.enable(C),d[C]=!0)}function we(C){d[C]!==!1&&(i.disable(C),d[C]=!1)}function Ze(C,re){return m[C]!==re?(i.bindFramebuffer(C,re),m[C]=re,n&&(C===i.DRAW_FRAMEBUFFER&&(m[i.FRAMEBUFFER]=re),C===i.FRAMEBUFFER&&(m[i.DRAW_FRAMEBUFFER]=re)),!0):!1}function F(C,re){let ce=_,Re=!1;if(C)if(ce=g.get(re),ce===void 0&&(ce=[],g.set(re,ce)),C.isWebGLMultipleRenderTargets){const Te=C.texture;if(ce.length!==Te.length||ce[0]!==i.COLOR_ATTACHMENT0){for(let Je=0,Qe=Te.length;Je<Qe;Je++)ce[Je]=i.COLOR_ATTACHMENT0+Je;ce.length=Te.length,Re=!0}}else ce[0]!==i.COLOR_ATTACHMENT0&&(ce[0]=i.COLOR_ATTACHMENT0,Re=!0);else ce[0]!==i.BACK&&(ce[0]=i.BACK,Re=!0);Re&&(t.isWebGL2?i.drawBuffers(ce):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(ce))}function Ot(C){return p!==C?(i.useProgram(C),p=C,!0):!1}const be={[Ci]:i.FUNC_ADD,[Gh]:i.FUNC_SUBTRACT,[Vh]:i.FUNC_REVERSE_SUBTRACT};if(n)be[pl]=i.MIN,be[ml]=i.MAX;else{const C=e.get("EXT_blend_minmax");C!==null&&(be[pl]=C.MIN_EXT,be[ml]=C.MAX_EXT)}const De={[kh]:i.ZERO,[Wh]:i.ONE,[Xh]:i.SRC_COLOR,[pa]:i.SRC_ALPHA,[Zh]:i.SRC_ALPHA_SATURATE,[$h]:i.DST_COLOR,[qh]:i.DST_ALPHA,[Yh]:i.ONE_MINUS_SRC_COLOR,[ma]:i.ONE_MINUS_SRC_ALPHA,[Kh]:i.ONE_MINUS_DST_COLOR,[jh]:i.ONE_MINUS_DST_ALPHA,[Jh]:i.CONSTANT_COLOR,[Qh]:i.ONE_MINUS_CONSTANT_COLOR,[ed]:i.CONSTANT_ALPHA,[td]:i.ONE_MINUS_CONSTANT_ALPHA};function ge(C,re,ce,Re,Te,Je,Qe,St,yt,tt){if(C===di){f===!0&&(we(i.BLEND),f=!1);return}if(f===!1&&(Oe(i.BLEND),f=!0),C!==Hh){if(C!==y||tt!==k){if((x!==Ci||P!==Ci)&&(i.blendEquation(i.FUNC_ADD),x=Ci,P=Ci),tt)switch(C){case gr:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case hl:i.blendFunc(i.ONE,i.ONE);break;case dl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case fl:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",C);break}else switch(C){case gr:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case hl:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case dl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case fl:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",C);break}b=null,L=null,R=null,K=null,S.set(0,0,0),A=0,y=C,k=tt}return}Te=Te||re,Je=Je||ce,Qe=Qe||Re,(re!==x||Te!==P)&&(i.blendEquationSeparate(be[re],be[Te]),x=re,P=Te),(ce!==b||Re!==L||Je!==R||Qe!==K)&&(i.blendFuncSeparate(De[ce],De[Re],De[Je],De[Qe]),b=ce,L=Re,R=Je,K=Qe),(St.equals(S)===!1||yt!==A)&&(i.blendColor(St.r,St.g,St.b,yt),S.copy(St),A=yt),y=C,k=!1}function ut(C,re){C.side===Rn?we(i.CULL_FACE):Oe(i.CULL_FACE);let ce=C.side===Qt;re&&(ce=!ce),He(ce),C.blending===gr&&C.transparent===!1?ge(di):ge(C.blending,C.blendEquation,C.blendSrc,C.blendDst,C.blendEquationAlpha,C.blendSrcAlpha,C.blendDstAlpha,C.blendColor,C.blendAlpha,C.premultipliedAlpha),l.setFunc(C.depthFunc),l.setTest(C.depthTest),l.setMask(C.depthWrite),o.setMask(C.colorWrite);const Re=C.stencilWrite;c.setTest(Re),Re&&(c.setMask(C.stencilWriteMask),c.setFunc(C.stencilFunc,C.stencilRef,C.stencilFuncMask),c.setOp(C.stencilFail,C.stencilZFail,C.stencilZPass)),N(C.polygonOffset,C.polygonOffsetFactor,C.polygonOffsetUnits),C.alphaToCoverage===!0?Oe(i.SAMPLE_ALPHA_TO_COVERAGE):we(i.SAMPLE_ALPHA_TO_COVERAGE)}function He(C){X!==C&&(C?i.frontFace(i.CW):i.frontFace(i.CCW),X=C)}function E(C){C!==Oh?(Oe(i.CULL_FACE),C!==oe&&(C===ul?i.cullFace(i.BACK):C===Bh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):we(i.CULL_FACE),oe=C}function v(C){C!==D&&(Y&&i.lineWidth(C),D=C)}function N(C,re,ce){C?(Oe(i.POLYGON_OFFSET_FILL),(z!==re||V!==ce)&&(i.polygonOffset(re,ce),z=re,V=ce)):we(i.POLYGON_OFFSET_FILL)}function te(C){C?Oe(i.SCISSOR_TEST):we(i.SCISSOR_TEST)}function Q(C){C===void 0&&(C=i.TEXTURE0+j-1),se!==C&&(i.activeTexture(C),se=C)}function ne(C,re,ce){ce===void 0&&(se===null?ce=i.TEXTURE0+j-1:ce=se);let Re=ae[ce];Re===void 0&&(Re={type:void 0,texture:void 0},ae[ce]=Re),(Re.type!==C||Re.texture!==re)&&(se!==ce&&(i.activeTexture(ce),se=ce),i.bindTexture(C,re||Fe[C]),Re.type=C,Re.texture=re)}function xe(){const C=ae[se];C!==void 0&&C.type!==void 0&&(i.bindTexture(C.type,null),C.type=void 0,C.texture=void 0)}function ue(){try{i.compressedTexImage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function me(){try{i.compressedTexImage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Ae(){try{i.texSubImage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Ge(){try{i.texSubImage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function J(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function it(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Xe(){try{i.texStorage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Ie(){try{i.texStorage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function ye(){try{i.texImage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function de(){try{i.texImage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function T(C){he.equals(C)===!1&&(i.scissor(C.x,C.y,C.z,C.w),he.copy(C))}function ie(C){Se.equals(C)===!1&&(i.viewport(C.x,C.y,C.z,C.w),Se.copy(C))}function Me(C,re){let ce=h.get(re);ce===void 0&&(ce=new WeakMap,h.set(re,ce));let Re=ce.get(C);Re===void 0&&(Re=i.getUniformBlockIndex(re,C.name),ce.set(C,Re))}function pe(C,re){const Re=h.get(re).get(C);u.get(re)!==Re&&(i.uniformBlockBinding(re,Re,C.__bindingPointIndex),u.set(re,Re))}function ee(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),n===!0&&(i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null)),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),d={},se=null,ae={},m={},g=new WeakMap,_=[],p=null,f=!1,y=null,x=null,b=null,L=null,P=null,R=null,K=null,S=new je(0,0,0),A=0,k=!1,X=null,oe=null,D=null,z=null,V=null,he.set(0,0,i.canvas.width,i.canvas.height),Se.set(0,0,i.canvas.width,i.canvas.height),o.reset(),l.reset(),c.reset()}return{buffers:{color:o,depth:l,stencil:c},enable:Oe,disable:we,bindFramebuffer:Ze,drawBuffers:F,useProgram:Ot,setBlending:ge,setMaterial:ut,setFlipSided:He,setCullFace:E,setLineWidth:v,setPolygonOffset:N,setScissorTest:te,activeTexture:Q,bindTexture:ne,unbindTexture:xe,compressedTexImage2D:ue,compressedTexImage3D:me,texImage2D:ye,texImage3D:de,updateUBOMapping:Me,uniformBlockBinding:pe,texStorage2D:Xe,texStorage3D:Ie,texSubImage2D:Ae,texSubImage3D:Ge,compressedTexSubImage2D:J,compressedTexSubImage3D:it,scissor:T,viewport:ie,reset:ee}}function F_(i,e,t,n,r,s,a){const o=r.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),u=new WeakMap;let h;const d=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(E,v){return m?new OffscreenCanvas(E,v):js("canvas")}function _(E,v,N,te){let Q=1;if((E.width>te||E.height>te)&&(Q=te/Math.max(E.width,E.height)),Q<1||v===!0)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap){const ne=v?Ea:Math.floor,xe=ne(Q*E.width),ue=ne(Q*E.height);h===void 0&&(h=g(xe,ue));const me=N?g(xe,ue):h;return me.width=xe,me.height=ue,me.getContext("2d").drawImage(E,0,0,xe,ue),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+E.width+"x"+E.height+") to ("+xe+"x"+ue+")."),me}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+E.width+"x"+E.height+")."),E;return E}function p(E){return Xl(E.width)&&Xl(E.height)}function f(E){return o?!1:E.wrapS!==Cn||E.wrapT!==Cn||E.minFilter!==Jt&&E.minFilter!==mn}function y(E,v){return E.generateMipmaps&&v&&E.minFilter!==Jt&&E.minFilter!==mn}function x(E){i.generateMipmap(E)}function b(E,v,N,te,Q=!1){if(o===!1)return v;if(E!==null){if(i[E]!==void 0)return i[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let ne=v;if(v===i.RED&&(N===i.FLOAT&&(ne=i.R32F),N===i.HALF_FLOAT&&(ne=i.R16F),N===i.UNSIGNED_BYTE&&(ne=i.R8)),v===i.RED_INTEGER&&(N===i.UNSIGNED_BYTE&&(ne=i.R8UI),N===i.UNSIGNED_SHORT&&(ne=i.R16UI),N===i.UNSIGNED_INT&&(ne=i.R32UI),N===i.BYTE&&(ne=i.R8I),N===i.SHORT&&(ne=i.R16I),N===i.INT&&(ne=i.R32I)),v===i.RG&&(N===i.FLOAT&&(ne=i.RG32F),N===i.HALF_FLOAT&&(ne=i.RG16F),N===i.UNSIGNED_BYTE&&(ne=i.RG8)),v===i.RGBA){const xe=Q?Ws:st.getTransfer(te);N===i.FLOAT&&(ne=i.RGBA32F),N===i.HALF_FLOAT&&(ne=i.RGBA16F),N===i.UNSIGNED_BYTE&&(ne=xe===dt?i.SRGB8_ALPHA8:i.RGBA8),N===i.UNSIGNED_SHORT_4_4_4_4&&(ne=i.RGBA4),N===i.UNSIGNED_SHORT_5_5_5_1&&(ne=i.RGB5_A1)}return(ne===i.R16F||ne===i.R32F||ne===i.RG16F||ne===i.RG32F||ne===i.RGBA16F||ne===i.RGBA32F)&&e.get("EXT_color_buffer_float"),ne}function L(E,v,N){return y(E,N)===!0||E.isFramebufferTexture&&E.minFilter!==Jt&&E.minFilter!==mn?Math.log2(Math.max(v.width,v.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?v.mipmaps.length:1}function P(E){return E===Jt||E===gl||E===yo?i.NEAREST:i.LINEAR}function R(E){const v=E.target;v.removeEventListener("dispose",R),S(v),v.isVideoTexture&&u.delete(v)}function K(E){const v=E.target;v.removeEventListener("dispose",K),k(v)}function S(E){const v=n.get(E);if(v.__webglInit===void 0)return;const N=E.source,te=d.get(N);if(te){const Q=te[v.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&A(E),Object.keys(te).length===0&&d.delete(N)}n.remove(E)}function A(E){const v=n.get(E);i.deleteTexture(v.__webglTexture);const N=E.source,te=d.get(N);delete te[v.__cacheKey],a.memory.textures--}function k(E){const v=E.texture,N=n.get(E),te=n.get(v);if(te.__webglTexture!==void 0&&(i.deleteTexture(te.__webglTexture),a.memory.textures--),E.depthTexture&&E.depthTexture.dispose(),E.isWebGLCubeRenderTarget)for(let Q=0;Q<6;Q++){if(Array.isArray(N.__webglFramebuffer[Q]))for(let ne=0;ne<N.__webglFramebuffer[Q].length;ne++)i.deleteFramebuffer(N.__webglFramebuffer[Q][ne]);else i.deleteFramebuffer(N.__webglFramebuffer[Q]);N.__webglDepthbuffer&&i.deleteRenderbuffer(N.__webglDepthbuffer[Q])}else{if(Array.isArray(N.__webglFramebuffer))for(let Q=0;Q<N.__webglFramebuffer.length;Q++)i.deleteFramebuffer(N.__webglFramebuffer[Q]);else i.deleteFramebuffer(N.__webglFramebuffer);if(N.__webglDepthbuffer&&i.deleteRenderbuffer(N.__webglDepthbuffer),N.__webglMultisampledFramebuffer&&i.deleteFramebuffer(N.__webglMultisampledFramebuffer),N.__webglColorRenderbuffer)for(let Q=0;Q<N.__webglColorRenderbuffer.length;Q++)N.__webglColorRenderbuffer[Q]&&i.deleteRenderbuffer(N.__webglColorRenderbuffer[Q]);N.__webglDepthRenderbuffer&&i.deleteRenderbuffer(N.__webglDepthRenderbuffer)}if(E.isWebGLMultipleRenderTargets)for(let Q=0,ne=v.length;Q<ne;Q++){const xe=n.get(v[Q]);xe.__webglTexture&&(i.deleteTexture(xe.__webglTexture),a.memory.textures--),n.remove(v[Q])}n.remove(v),n.remove(E)}let X=0;function oe(){X=0}function D(){const E=X;return E>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+r.maxTextures),X+=1,E}function z(E){const v=[];return v.push(E.wrapS),v.push(E.wrapT),v.push(E.wrapR||0),v.push(E.magFilter),v.push(E.minFilter),v.push(E.anisotropy),v.push(E.internalFormat),v.push(E.format),v.push(E.type),v.push(E.generateMipmaps),v.push(E.premultiplyAlpha),v.push(E.flipY),v.push(E.unpackAlignment),v.push(E.colorSpace),v.join()}function V(E,v){const N=n.get(E);if(E.isVideoTexture&&ut(E),E.isRenderTargetTexture===!1&&E.version>0&&N.__version!==E.version){const te=E.image;if(te===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(te.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{he(N,E,v);return}}t.bindTexture(i.TEXTURE_2D,N.__webglTexture,i.TEXTURE0+v)}function j(E,v){const N=n.get(E);if(E.version>0&&N.__version!==E.version){he(N,E,v);return}t.bindTexture(i.TEXTURE_2D_ARRAY,N.__webglTexture,i.TEXTURE0+v)}function Y(E,v){const N=n.get(E);if(E.version>0&&N.__version!==E.version){he(N,E,v);return}t.bindTexture(i.TEXTURE_3D,N.__webglTexture,i.TEXTURE0+v)}function q(E,v){const N=n.get(E);if(E.version>0&&N.__version!==E.version){Se(N,E,v);return}t.bindTexture(i.TEXTURE_CUBE_MAP,N.__webglTexture,i.TEXTURE0+v)}const $={[xa]:i.REPEAT,[Cn]:i.CLAMP_TO_EDGE,[va]:i.MIRRORED_REPEAT},se={[Jt]:i.NEAREST,[gl]:i.NEAREST_MIPMAP_NEAREST,[yo]:i.NEAREST_MIPMAP_LINEAR,[mn]:i.LINEAR,[gd]:i.LINEAR_MIPMAP_NEAREST,[qr]:i.LINEAR_MIPMAP_LINEAR},ae={[Rd]:i.NEVER,[Ud]:i.ALWAYS,[Cd]:i.LESS,[Lu]:i.LEQUAL,[Pd]:i.EQUAL,[Id]:i.GEQUAL,[Ld]:i.GREATER,[Dd]:i.NOTEQUAL};function G(E,v,N){if(N?(i.texParameteri(E,i.TEXTURE_WRAP_S,$[v.wrapS]),i.texParameteri(E,i.TEXTURE_WRAP_T,$[v.wrapT]),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,$[v.wrapR]),i.texParameteri(E,i.TEXTURE_MAG_FILTER,se[v.magFilter]),i.texParameteri(E,i.TEXTURE_MIN_FILTER,se[v.minFilter])):(i.texParameteri(E,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(E,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,i.CLAMP_TO_EDGE),(v.wrapS!==Cn||v.wrapT!==Cn)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),i.texParameteri(E,i.TEXTURE_MAG_FILTER,P(v.magFilter)),i.texParameteri(E,i.TEXTURE_MIN_FILTER,P(v.minFilter)),v.minFilter!==Jt&&v.minFilter!==mn&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),v.compareFunction&&(i.texParameteri(E,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(E,i.TEXTURE_COMPARE_FUNC,ae[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){const te=e.get("EXT_texture_filter_anisotropic");if(v.magFilter===Jt||v.minFilter!==yo&&v.minFilter!==qr||v.type===ai&&e.has("OES_texture_float_linear")===!1||o===!1&&v.type===jr&&e.has("OES_texture_half_float_linear")===!1)return;(v.anisotropy>1||n.get(v).__currentAnisotropy)&&(i.texParameterf(E,te.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,r.getMaxAnisotropy())),n.get(v).__currentAnisotropy=v.anisotropy)}}function Z(E,v){let N=!1;E.__webglInit===void 0&&(E.__webglInit=!0,v.addEventListener("dispose",R));const te=v.source;let Q=d.get(te);Q===void 0&&(Q={},d.set(te,Q));const ne=z(v);if(ne!==E.__cacheKey){Q[ne]===void 0&&(Q[ne]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,N=!0),Q[ne].usedTimes++;const xe=Q[E.__cacheKey];xe!==void 0&&(Q[E.__cacheKey].usedTimes--,xe.usedTimes===0&&A(v)),E.__cacheKey=ne,E.__webglTexture=Q[ne].texture}return N}function he(E,v,N){let te=i.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(te=i.TEXTURE_2D_ARRAY),v.isData3DTexture&&(te=i.TEXTURE_3D);const Q=Z(E,v),ne=v.source;t.bindTexture(te,E.__webglTexture,i.TEXTURE0+N);const xe=n.get(ne);if(ne.version!==xe.__version||Q===!0){t.activeTexture(i.TEXTURE0+N);const ue=st.getPrimaries(st.workingColorSpace),me=v.colorSpace===xn?null:st.getPrimaries(v.colorSpace),Ae=v.colorSpace===xn||ue===me?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ae);const Ge=f(v)&&p(v.image)===!1;let J=_(v.image,Ge,!1,r.maxTextureSize);J=He(v,J);const it=p(J)||o,Xe=s.convert(v.format,v.colorSpace);let Ie=s.convert(v.type),ye=b(v.internalFormat,Xe,Ie,v.colorSpace,v.isVideoTexture);G(te,v,it);let de;const T=v.mipmaps,ie=o&&v.isVideoTexture!==!0&&ye!==Ru,Me=xe.__version===void 0||Q===!0,pe=L(v,J,it);if(v.isDepthTexture)ye=i.DEPTH_COMPONENT,o?v.type===ai?ye=i.DEPTH_COMPONENT32F:v.type===oi?ye=i.DEPTH_COMPONENT24:v.type===Ii?ye=i.DEPTH24_STENCIL8:ye=i.DEPTH_COMPONENT16:v.type===ai&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),v.format===Ui&&ye===i.DEPTH_COMPONENT&&v.type!==Va&&v.type!==oi&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),v.type=oi,Ie=s.convert(v.type)),v.format===Er&&ye===i.DEPTH_COMPONENT&&(ye=i.DEPTH_STENCIL,v.type!==Ii&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),v.type=Ii,Ie=s.convert(v.type))),Me&&(ie?t.texStorage2D(i.TEXTURE_2D,1,ye,J.width,J.height):t.texImage2D(i.TEXTURE_2D,0,ye,J.width,J.height,0,Xe,Ie,null));else if(v.isDataTexture)if(T.length>0&&it){ie&&Me&&t.texStorage2D(i.TEXTURE_2D,pe,ye,T[0].width,T[0].height);for(let ee=0,C=T.length;ee<C;ee++)de=T[ee],ie?t.texSubImage2D(i.TEXTURE_2D,ee,0,0,de.width,de.height,Xe,Ie,de.data):t.texImage2D(i.TEXTURE_2D,ee,ye,de.width,de.height,0,Xe,Ie,de.data);v.generateMipmaps=!1}else ie?(Me&&t.texStorage2D(i.TEXTURE_2D,pe,ye,J.width,J.height),t.texSubImage2D(i.TEXTURE_2D,0,0,0,J.width,J.height,Xe,Ie,J.data)):t.texImage2D(i.TEXTURE_2D,0,ye,J.width,J.height,0,Xe,Ie,J.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){ie&&Me&&t.texStorage3D(i.TEXTURE_2D_ARRAY,pe,ye,T[0].width,T[0].height,J.depth);for(let ee=0,C=T.length;ee<C;ee++)de=T[ee],v.format!==Pn?Xe!==null?ie?t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ee,0,0,0,de.width,de.height,J.depth,Xe,de.data,0,0):t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ee,ye,de.width,de.height,J.depth,0,de.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ie?t.texSubImage3D(i.TEXTURE_2D_ARRAY,ee,0,0,0,de.width,de.height,J.depth,Xe,Ie,de.data):t.texImage3D(i.TEXTURE_2D_ARRAY,ee,ye,de.width,de.height,J.depth,0,Xe,Ie,de.data)}else{ie&&Me&&t.texStorage2D(i.TEXTURE_2D,pe,ye,T[0].width,T[0].height);for(let ee=0,C=T.length;ee<C;ee++)de=T[ee],v.format!==Pn?Xe!==null?ie?t.compressedTexSubImage2D(i.TEXTURE_2D,ee,0,0,de.width,de.height,Xe,de.data):t.compressedTexImage2D(i.TEXTURE_2D,ee,ye,de.width,de.height,0,de.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ie?t.texSubImage2D(i.TEXTURE_2D,ee,0,0,de.width,de.height,Xe,Ie,de.data):t.texImage2D(i.TEXTURE_2D,ee,ye,de.width,de.height,0,Xe,Ie,de.data)}else if(v.isDataArrayTexture)ie?(Me&&t.texStorage3D(i.TEXTURE_2D_ARRAY,pe,ye,J.width,J.height,J.depth),t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,J.width,J.height,J.depth,Xe,Ie,J.data)):t.texImage3D(i.TEXTURE_2D_ARRAY,0,ye,J.width,J.height,J.depth,0,Xe,Ie,J.data);else if(v.isData3DTexture)ie?(Me&&t.texStorage3D(i.TEXTURE_3D,pe,ye,J.width,J.height,J.depth),t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,J.width,J.height,J.depth,Xe,Ie,J.data)):t.texImage3D(i.TEXTURE_3D,0,ye,J.width,J.height,J.depth,0,Xe,Ie,J.data);else if(v.isFramebufferTexture){if(Me)if(ie)t.texStorage2D(i.TEXTURE_2D,pe,ye,J.width,J.height);else{let ee=J.width,C=J.height;for(let re=0;re<pe;re++)t.texImage2D(i.TEXTURE_2D,re,ye,ee,C,0,Xe,Ie,null),ee>>=1,C>>=1}}else if(T.length>0&&it){ie&&Me&&t.texStorage2D(i.TEXTURE_2D,pe,ye,T[0].width,T[0].height);for(let ee=0,C=T.length;ee<C;ee++)de=T[ee],ie?t.texSubImage2D(i.TEXTURE_2D,ee,0,0,Xe,Ie,de):t.texImage2D(i.TEXTURE_2D,ee,ye,Xe,Ie,de);v.generateMipmaps=!1}else ie?(Me&&t.texStorage2D(i.TEXTURE_2D,pe,ye,J.width,J.height),t.texSubImage2D(i.TEXTURE_2D,0,0,0,Xe,Ie,J)):t.texImage2D(i.TEXTURE_2D,0,ye,Xe,Ie,J);y(v,it)&&x(te),xe.__version=ne.version,v.onUpdate&&v.onUpdate(v)}E.__version=v.version}function Se(E,v,N){if(v.image.length!==6)return;const te=Z(E,v),Q=v.source;t.bindTexture(i.TEXTURE_CUBE_MAP,E.__webglTexture,i.TEXTURE0+N);const ne=n.get(Q);if(Q.version!==ne.__version||te===!0){t.activeTexture(i.TEXTURE0+N);const xe=st.getPrimaries(st.workingColorSpace),ue=v.colorSpace===xn?null:st.getPrimaries(v.colorSpace),me=v.colorSpace===xn||xe===ue?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,me);const Ae=v.isCompressedTexture||v.image[0].isCompressedTexture,Ge=v.image[0]&&v.image[0].isDataTexture,J=[];for(let ee=0;ee<6;ee++)!Ae&&!Ge?J[ee]=_(v.image[ee],!1,!0,r.maxCubemapSize):J[ee]=Ge?v.image[ee].image:v.image[ee],J[ee]=He(v,J[ee]);const it=J[0],Xe=p(it)||o,Ie=s.convert(v.format,v.colorSpace),ye=s.convert(v.type),de=b(v.internalFormat,Ie,ye,v.colorSpace),T=o&&v.isVideoTexture!==!0,ie=ne.__version===void 0||te===!0;let Me=L(v,it,Xe);G(i.TEXTURE_CUBE_MAP,v,Xe);let pe;if(Ae){T&&ie&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Me,de,it.width,it.height);for(let ee=0;ee<6;ee++){pe=J[ee].mipmaps;for(let C=0;C<pe.length;C++){const re=pe[C];v.format!==Pn?Ie!==null?T?t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,C,0,0,re.width,re.height,Ie,re.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,C,de,re.width,re.height,0,re.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):T?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,C,0,0,re.width,re.height,Ie,ye,re.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,C,de,re.width,re.height,0,Ie,ye,re.data)}}}else{pe=v.mipmaps,T&&ie&&(pe.length>0&&Me++,t.texStorage2D(i.TEXTURE_CUBE_MAP,Me,de,J[0].width,J[0].height));for(let ee=0;ee<6;ee++)if(Ge){T?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,J[ee].width,J[ee].height,Ie,ye,J[ee].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,de,J[ee].width,J[ee].height,0,Ie,ye,J[ee].data);for(let C=0;C<pe.length;C++){const ce=pe[C].image[ee].image;T?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,C+1,0,0,ce.width,ce.height,Ie,ye,ce.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,C+1,de,ce.width,ce.height,0,Ie,ye,ce.data)}}else{T?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,Ie,ye,J[ee]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,de,Ie,ye,J[ee]);for(let C=0;C<pe.length;C++){const re=pe[C];T?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,C+1,0,0,Ie,ye,re.image[ee]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,C+1,de,Ie,ye,re.image[ee])}}}y(v,Xe)&&x(i.TEXTURE_CUBE_MAP),ne.__version=Q.version,v.onUpdate&&v.onUpdate(v)}E.__version=v.version}function ve(E,v,N,te,Q,ne){const xe=s.convert(N.format,N.colorSpace),ue=s.convert(N.type),me=b(N.internalFormat,xe,ue,N.colorSpace);if(!n.get(v).__hasExternalTextures){const Ge=Math.max(1,v.width>>ne),J=Math.max(1,v.height>>ne);Q===i.TEXTURE_3D||Q===i.TEXTURE_2D_ARRAY?t.texImage3D(Q,ne,me,Ge,J,v.depth,0,xe,ue,null):t.texImage2D(Q,ne,me,Ge,J,0,xe,ue,null)}t.bindFramebuffer(i.FRAMEBUFFER,E),ge(v)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,te,Q,n.get(N).__webglTexture,0,De(v)):(Q===i.TEXTURE_2D||Q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,te,Q,n.get(N).__webglTexture,ne),t.bindFramebuffer(i.FRAMEBUFFER,null)}function Fe(E,v,N){if(i.bindRenderbuffer(i.RENDERBUFFER,E),v.depthBuffer&&!v.stencilBuffer){let te=o===!0?i.DEPTH_COMPONENT24:i.DEPTH_COMPONENT16;if(N||ge(v)){const Q=v.depthTexture;Q&&Q.isDepthTexture&&(Q.type===ai?te=i.DEPTH_COMPONENT32F:Q.type===oi&&(te=i.DEPTH_COMPONENT24));const ne=De(v);ge(v)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ne,te,v.width,v.height):i.renderbufferStorageMultisample(i.RENDERBUFFER,ne,te,v.width,v.height)}else i.renderbufferStorage(i.RENDERBUFFER,te,v.width,v.height);i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.RENDERBUFFER,E)}else if(v.depthBuffer&&v.stencilBuffer){const te=De(v);N&&ge(v)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,te,i.DEPTH24_STENCIL8,v.width,v.height):ge(v)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,te,i.DEPTH24_STENCIL8,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,i.DEPTH_STENCIL,v.width,v.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.RENDERBUFFER,E)}else{const te=v.isWebGLMultipleRenderTargets===!0?v.texture:[v.texture];for(let Q=0;Q<te.length;Q++){const ne=te[Q],xe=s.convert(ne.format,ne.colorSpace),ue=s.convert(ne.type),me=b(ne.internalFormat,xe,ue,ne.colorSpace),Ae=De(v);N&&ge(v)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ae,me,v.width,v.height):ge(v)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ae,me,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,me,v.width,v.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Oe(E,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,E),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(v.depthTexture).__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),V(v.depthTexture,0);const te=n.get(v.depthTexture).__webglTexture,Q=De(v);if(v.depthTexture.format===Ui)ge(v)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,te,0,Q):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,te,0);else if(v.depthTexture.format===Er)ge(v)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,te,0,Q):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,te,0);else throw new Error("Unknown depthTexture format")}function we(E){const v=n.get(E),N=E.isWebGLCubeRenderTarget===!0;if(E.depthTexture&&!v.__autoAllocateDepthBuffer){if(N)throw new Error("target.depthTexture not supported in Cube render targets");Oe(v.__webglFramebuffer,E)}else if(N){v.__webglDepthbuffer=[];for(let te=0;te<6;te++)t.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer[te]),v.__webglDepthbuffer[te]=i.createRenderbuffer(),Fe(v.__webglDepthbuffer[te],E,!1)}else t.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer=i.createRenderbuffer(),Fe(v.__webglDepthbuffer,E,!1);t.bindFramebuffer(i.FRAMEBUFFER,null)}function Ze(E,v,N){const te=n.get(E);v!==void 0&&ve(te.__webglFramebuffer,E,E.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),N!==void 0&&we(E)}function F(E){const v=E.texture,N=n.get(E),te=n.get(v);E.addEventListener("dispose",K),E.isWebGLMultipleRenderTargets!==!0&&(te.__webglTexture===void 0&&(te.__webglTexture=i.createTexture()),te.__version=v.version,a.memory.textures++);const Q=E.isWebGLCubeRenderTarget===!0,ne=E.isWebGLMultipleRenderTargets===!0,xe=p(E)||o;if(Q){N.__webglFramebuffer=[];for(let ue=0;ue<6;ue++)if(o&&v.mipmaps&&v.mipmaps.length>0){N.__webglFramebuffer[ue]=[];for(let me=0;me<v.mipmaps.length;me++)N.__webglFramebuffer[ue][me]=i.createFramebuffer()}else N.__webglFramebuffer[ue]=i.createFramebuffer()}else{if(o&&v.mipmaps&&v.mipmaps.length>0){N.__webglFramebuffer=[];for(let ue=0;ue<v.mipmaps.length;ue++)N.__webglFramebuffer[ue]=i.createFramebuffer()}else N.__webglFramebuffer=i.createFramebuffer();if(ne)if(r.drawBuffers){const ue=E.texture;for(let me=0,Ae=ue.length;me<Ae;me++){const Ge=n.get(ue[me]);Ge.__webglTexture===void 0&&(Ge.__webglTexture=i.createTexture(),a.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(o&&E.samples>0&&ge(E)===!1){const ue=ne?v:[v];N.__webglMultisampledFramebuffer=i.createFramebuffer(),N.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,N.__webglMultisampledFramebuffer);for(let me=0;me<ue.length;me++){const Ae=ue[me];N.__webglColorRenderbuffer[me]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,N.__webglColorRenderbuffer[me]);const Ge=s.convert(Ae.format,Ae.colorSpace),J=s.convert(Ae.type),it=b(Ae.internalFormat,Ge,J,Ae.colorSpace,E.isXRRenderTarget===!0),Xe=De(E);i.renderbufferStorageMultisample(i.RENDERBUFFER,Xe,it,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+me,i.RENDERBUFFER,N.__webglColorRenderbuffer[me])}i.bindRenderbuffer(i.RENDERBUFFER,null),E.depthBuffer&&(N.__webglDepthRenderbuffer=i.createRenderbuffer(),Fe(N.__webglDepthRenderbuffer,E,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(Q){t.bindTexture(i.TEXTURE_CUBE_MAP,te.__webglTexture),G(i.TEXTURE_CUBE_MAP,v,xe);for(let ue=0;ue<6;ue++)if(o&&v.mipmaps&&v.mipmaps.length>0)for(let me=0;me<v.mipmaps.length;me++)ve(N.__webglFramebuffer[ue][me],E,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,me);else ve(N.__webglFramebuffer[ue],E,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0);y(v,xe)&&x(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ne){const ue=E.texture;for(let me=0,Ae=ue.length;me<Ae;me++){const Ge=ue[me],J=n.get(Ge);t.bindTexture(i.TEXTURE_2D,J.__webglTexture),G(i.TEXTURE_2D,Ge,xe),ve(N.__webglFramebuffer,E,Ge,i.COLOR_ATTACHMENT0+me,i.TEXTURE_2D,0),y(Ge,xe)&&x(i.TEXTURE_2D)}t.unbindTexture()}else{let ue=i.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(o?ue=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(ue,te.__webglTexture),G(ue,v,xe),o&&v.mipmaps&&v.mipmaps.length>0)for(let me=0;me<v.mipmaps.length;me++)ve(N.__webglFramebuffer[me],E,v,i.COLOR_ATTACHMENT0,ue,me);else ve(N.__webglFramebuffer,E,v,i.COLOR_ATTACHMENT0,ue,0);y(v,xe)&&x(ue),t.unbindTexture()}E.depthBuffer&&we(E)}function Ot(E){const v=p(E)||o,N=E.isWebGLMultipleRenderTargets===!0?E.texture:[E.texture];for(let te=0,Q=N.length;te<Q;te++){const ne=N[te];if(y(ne,v)){const xe=E.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,ue=n.get(ne).__webglTexture;t.bindTexture(xe,ue),x(xe),t.unbindTexture()}}}function be(E){if(o&&E.samples>0&&ge(E)===!1){const v=E.isWebGLMultipleRenderTargets?E.texture:[E.texture],N=E.width,te=E.height;let Q=i.COLOR_BUFFER_BIT;const ne=[],xe=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ue=n.get(E),me=E.isWebGLMultipleRenderTargets===!0;if(me)for(let Ae=0;Ae<v.length;Ae++)t.bindFramebuffer(i.FRAMEBUFFER,ue.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ae,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ue.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ae,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ue.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ue.__webglFramebuffer);for(let Ae=0;Ae<v.length;Ae++){ne.push(i.COLOR_ATTACHMENT0+Ae),E.depthBuffer&&ne.push(xe);const Ge=ue.__ignoreDepthValues!==void 0?ue.__ignoreDepthValues:!1;if(Ge===!1&&(E.depthBuffer&&(Q|=i.DEPTH_BUFFER_BIT),E.stencilBuffer&&(Q|=i.STENCIL_BUFFER_BIT)),me&&i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ue.__webglColorRenderbuffer[Ae]),Ge===!0&&(i.invalidateFramebuffer(i.READ_FRAMEBUFFER,[xe]),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[xe])),me){const J=n.get(v[Ae]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,J,0)}i.blitFramebuffer(0,0,N,te,0,0,N,te,Q,i.NEAREST),c&&i.invalidateFramebuffer(i.READ_FRAMEBUFFER,ne)}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),me)for(let Ae=0;Ae<v.length;Ae++){t.bindFramebuffer(i.FRAMEBUFFER,ue.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ae,i.RENDERBUFFER,ue.__webglColorRenderbuffer[Ae]);const Ge=n.get(v[Ae]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ue.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ae,i.TEXTURE_2D,Ge,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ue.__webglMultisampledFramebuffer)}}function De(E){return Math.min(r.maxSamples,E.samples)}function ge(E){const v=n.get(E);return o&&E.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function ut(E){const v=a.render.frame;u.get(E)!==v&&(u.set(E,v),E.update())}function He(E,v){const N=E.colorSpace,te=E.format,Q=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||E.format===Ma||N!==$n&&N!==xn&&(st.getTransfer(N)===dt?o===!1?e.has("EXT_sRGB")===!0&&te===Pn?(E.format=Ma,E.minFilter=mn,E.generateMipmaps=!1):v=Iu.sRGBToLinear(v):(te!==Pn||Q!==pi)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",N)),v}this.allocateTextureUnit=D,this.resetTextureUnits=oe,this.setTexture2D=V,this.setTexture2DArray=j,this.setTexture3D=Y,this.setTextureCube=q,this.rebindTextures=Ze,this.setupRenderTarget=F,this.updateRenderTargetMipmap=Ot,this.updateMultisampleRenderTarget=be,this.setupDepthRenderbuffer=we,this.setupFrameBufferTexture=ve,this.useMultisampledRTT=ge}function O_(i,e,t){const n=t.isWebGL2;function r(s,a=xn){let o;const l=st.getTransfer(a);if(s===pi)return i.UNSIGNED_BYTE;if(s===yu)return i.UNSIGNED_SHORT_4_4_4_4;if(s===bu)return i.UNSIGNED_SHORT_5_5_5_1;if(s===_d)return i.BYTE;if(s===xd)return i.SHORT;if(s===Va)return i.UNSIGNED_SHORT;if(s===Eu)return i.INT;if(s===oi)return i.UNSIGNED_INT;if(s===ai)return i.FLOAT;if(s===jr)return n?i.HALF_FLOAT:(o=e.get("OES_texture_half_float"),o!==null?o.HALF_FLOAT_OES:null);if(s===vd)return i.ALPHA;if(s===Pn)return i.RGBA;if(s===Md)return i.LUMINANCE;if(s===Sd)return i.LUMINANCE_ALPHA;if(s===Ui)return i.DEPTH_COMPONENT;if(s===Er)return i.DEPTH_STENCIL;if(s===Ma)return o=e.get("EXT_sRGB"),o!==null?o.SRGB_ALPHA_EXT:null;if(s===Ed)return i.RED;if(s===Tu)return i.RED_INTEGER;if(s===yd)return i.RG;if(s===Au)return i.RG_INTEGER;if(s===wu)return i.RGBA_INTEGER;if(s===bo||s===To||s===Ao||s===wo)if(l===dt)if(o=e.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(s===bo)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(s===To)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(s===Ao)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(s===wo)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=e.get("WEBGL_compressed_texture_s3tc"),o!==null){if(s===bo)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(s===To)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(s===Ao)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(s===wo)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(s===_l||s===xl||s===vl||s===Ml)if(o=e.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(s===_l)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(s===xl)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(s===vl)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(s===Ml)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(s===Ru)return o=e.get("WEBGL_compressed_texture_etc1"),o!==null?o.COMPRESSED_RGB_ETC1_WEBGL:null;if(s===Sl||s===El)if(o=e.get("WEBGL_compressed_texture_etc"),o!==null){if(s===Sl)return l===dt?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(s===El)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(s===yl||s===bl||s===Tl||s===Al||s===wl||s===Rl||s===Cl||s===Pl||s===Ll||s===Dl||s===Il||s===Ul||s===Nl||s===Fl)if(o=e.get("WEBGL_compressed_texture_astc"),o!==null){if(s===yl)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(s===bl)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(s===Tl)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(s===Al)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(s===wl)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(s===Rl)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(s===Cl)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(s===Pl)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(s===Ll)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(s===Dl)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(s===Il)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(s===Ul)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(s===Nl)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(s===Fl)return l===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(s===Ro||s===Ol||s===Bl)if(o=e.get("EXT_texture_compression_bptc"),o!==null){if(s===Ro)return l===dt?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(s===Ol)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(s===Bl)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(s===bd||s===zl||s===Hl||s===Gl)if(o=e.get("EXT_texture_compression_rgtc"),o!==null){if(s===Ro)return o.COMPRESSED_RED_RGTC1_EXT;if(s===zl)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(s===Hl)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(s===Gl)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return s===Ii?n?i.UNSIGNED_INT_24_8:(o=e.get("WEBGL_depth_texture"),o!==null?o.UNSIGNED_INT_24_8_WEBGL:null):i[s]!==void 0?i[s]:null}return{convert:r}}class B_ extends sn{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class pr extends Dt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const z_={type:"move"};class Jo{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new pr,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new pr,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new w,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new w),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new pr,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new w,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new w),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const _ of e.hand.values()){const p=t.getJointPose(_,n),f=this._getHandJoint(c,_);p!==null&&(f.matrix.fromArray(p.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=p.radius),f.visible=p!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),m=.02,g=.005;c.inputState.pinching&&d>m+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=m-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(z_)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new pr;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}class H_ extends Vi{constructor(e,t){super();const n=this;let r=null,s=1,a=null,o="local-floor",l=1,c=null,u=null,h=null,d=null,m=null,g=null;const _=t.getContextAttributes();let p=null,f=null;const y=[],x=[],b=new Ne;let L=null;const P=new sn;P.layers.enable(1),P.viewport=new gt;const R=new sn;R.layers.enable(2),R.viewport=new gt;const K=[P,R],S=new B_;S.layers.enable(1),S.layers.enable(2);let A=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(G){let Z=y[G];return Z===void 0&&(Z=new Jo,y[G]=Z),Z.getTargetRaySpace()},this.getControllerGrip=function(G){let Z=y[G];return Z===void 0&&(Z=new Jo,y[G]=Z),Z.getGripSpace()},this.getHand=function(G){let Z=y[G];return Z===void 0&&(Z=new Jo,y[G]=Z),Z.getHandSpace()};function X(G){const Z=x.indexOf(G.inputSource);if(Z===-1)return;const he=y[Z];he!==void 0&&(he.update(G.inputSource,G.frame,c||a),he.dispatchEvent({type:G.type,data:G.inputSource}))}function oe(){r.removeEventListener("select",X),r.removeEventListener("selectstart",X),r.removeEventListener("selectend",X),r.removeEventListener("squeeze",X),r.removeEventListener("squeezestart",X),r.removeEventListener("squeezeend",X),r.removeEventListener("end",oe),r.removeEventListener("inputsourceschange",D);for(let G=0;G<y.length;G++){const Z=x[G];Z!==null&&(x[G]=null,y[G].disconnect(Z))}A=null,k=null,e.setRenderTarget(p),m=null,d=null,h=null,r=null,f=null,ae.stop(),n.isPresenting=!1,e.setPixelRatio(L),e.setSize(b.width,b.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(G){s=G,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(G){o=G,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(G){c=G},this.getBaseLayer=function(){return d!==null?d:m},this.getBinding=function(){return h},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(G){if(r=G,r!==null){if(p=e.getRenderTarget(),r.addEventListener("select",X),r.addEventListener("selectstart",X),r.addEventListener("selectend",X),r.addEventListener("squeeze",X),r.addEventListener("squeezestart",X),r.addEventListener("squeezeend",X),r.addEventListener("end",oe),r.addEventListener("inputsourceschange",D),_.xrCompatible!==!0&&await t.makeXRCompatible(),L=e.getPixelRatio(),e.getSize(b),r.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const Z={antialias:r.renderState.layers===void 0?_.antialias:!0,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:s};m=new XRWebGLLayer(r,t,Z),r.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),f=new Fi(m.framebufferWidth,m.framebufferHeight,{format:Pn,type:pi,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil})}else{let Z=null,he=null,Se=null;_.depth&&(Se=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Z=_.stencil?Er:Ui,he=_.stencil?Ii:oi);const ve={colorFormat:t.RGBA8,depthFormat:Se,scaleFactor:s};h=new XRWebGLBinding(r,t),d=h.createProjectionLayer(ve),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),f=new Fi(d.textureWidth,d.textureHeight,{format:Pn,type:pi,depthTexture:new Wu(d.textureWidth,d.textureHeight,he,void 0,void 0,void 0,void 0,void 0,void 0,Z),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0});const Fe=e.properties.get(f);Fe.__ignoreDepthValues=d.ignoreDepthValues}f.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),ae.setContext(r),ae.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode};function D(G){for(let Z=0;Z<G.removed.length;Z++){const he=G.removed[Z],Se=x.indexOf(he);Se>=0&&(x[Se]=null,y[Se].disconnect(he))}for(let Z=0;Z<G.added.length;Z++){const he=G.added[Z];let Se=x.indexOf(he);if(Se===-1){for(let Fe=0;Fe<y.length;Fe++)if(Fe>=x.length){x.push(he),Se=Fe;break}else if(x[Fe]===null){x[Fe]=he,Se=Fe;break}if(Se===-1)break}const ve=y[Se];ve&&ve.connect(he)}}const z=new w,V=new w;function j(G,Z,he){z.setFromMatrixPosition(Z.matrixWorld),V.setFromMatrixPosition(he.matrixWorld);const Se=z.distanceTo(V),ve=Z.projectionMatrix.elements,Fe=he.projectionMatrix.elements,Oe=ve[14]/(ve[10]-1),we=ve[14]/(ve[10]+1),Ze=(ve[9]+1)/ve[5],F=(ve[9]-1)/ve[5],Ot=(ve[8]-1)/ve[0],be=(Fe[8]+1)/Fe[0],De=Oe*Ot,ge=Oe*be,ut=Se/(-Ot+be),He=ut*-Ot;Z.matrixWorld.decompose(G.position,G.quaternion,G.scale),G.translateX(He),G.translateZ(ut),G.matrixWorld.compose(G.position,G.quaternion,G.scale),G.matrixWorldInverse.copy(G.matrixWorld).invert();const E=Oe+ut,v=we+ut,N=De-He,te=ge+(Se-He),Q=Ze*we/v*E,ne=F*we/v*E;G.projectionMatrix.makePerspective(N,te,Q,ne,E,v),G.projectionMatrixInverse.copy(G.projectionMatrix).invert()}function Y(G,Z){Z===null?G.matrixWorld.copy(G.matrix):G.matrixWorld.multiplyMatrices(Z.matrixWorld,G.matrix),G.matrixWorldInverse.copy(G.matrixWorld).invert()}this.updateCamera=function(G){if(r===null)return;S.near=R.near=P.near=G.near,S.far=R.far=P.far=G.far,(A!==S.near||k!==S.far)&&(r.updateRenderState({depthNear:S.near,depthFar:S.far}),A=S.near,k=S.far);const Z=G.parent,he=S.cameras;Y(S,Z);for(let Se=0;Se<he.length;Se++)Y(he[Se],Z);he.length===2?j(S,P,R):S.projectionMatrix.copy(P.projectionMatrix),q(G,S,Z)};function q(G,Z,he){he===null?G.matrix.copy(Z.matrixWorld):(G.matrix.copy(he.matrixWorld),G.matrix.invert(),G.matrix.multiply(Z.matrixWorld)),G.matrix.decompose(G.position,G.quaternion,G.scale),G.updateMatrixWorld(!0),G.projectionMatrix.copy(Z.projectionMatrix),G.projectionMatrixInverse.copy(Z.projectionMatrixInverse),G.isPerspectiveCamera&&(G.fov=Sa*2*Math.atan(1/G.projectionMatrix.elements[5]),G.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(d===null&&m===null))return l},this.setFoveation=function(G){l=G,d!==null&&(d.fixedFoveation=G),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=G)};let $=null;function se(G,Z){if(u=Z.getViewerPose(c||a),g=Z,u!==null){const he=u.views;m!==null&&(e.setRenderTargetFramebuffer(f,m.framebuffer),e.setRenderTarget(f));let Se=!1;he.length!==S.cameras.length&&(S.cameras.length=0,Se=!0);for(let ve=0;ve<he.length;ve++){const Fe=he[ve];let Oe=null;if(m!==null)Oe=m.getViewport(Fe);else{const Ze=h.getViewSubImage(d,Fe);Oe=Ze.viewport,ve===0&&(e.setRenderTargetTextures(f,Ze.colorTexture,d.ignoreDepthValues?void 0:Ze.depthStencilTexture),e.setRenderTarget(f))}let we=K[ve];we===void 0&&(we=new sn,we.layers.enable(ve),we.viewport=new gt,K[ve]=we),we.matrix.fromArray(Fe.transform.matrix),we.matrix.decompose(we.position,we.quaternion,we.scale),we.projectionMatrix.fromArray(Fe.projectionMatrix),we.projectionMatrixInverse.copy(we.projectionMatrix).invert(),we.viewport.set(Oe.x,Oe.y,Oe.width,Oe.height),ve===0&&(S.matrix.copy(we.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),Se===!0&&S.cameras.push(we)}}for(let he=0;he<y.length;he++){const Se=x[he],ve=y[he];Se!==null&&ve!==void 0&&ve.update(Se,Z,c||a)}$&&$(G,Z),Z.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Z}),g=null}const ae=new Vu;ae.setAnimationLoop(se),this.setAnimationLoop=function(G){$=G},this.dispose=function(){}}}function G_(i,e){function t(p,f){p.matrixAutoUpdate===!0&&p.updateMatrix(),f.value.copy(p.matrix)}function n(p,f){f.color.getRGB(p.fogColor.value,zu(i)),f.isFog?(p.fogNear.value=f.near,p.fogFar.value=f.far):f.isFogExp2&&(p.fogDensity.value=f.density)}function r(p,f,y,x,b){f.isMeshBasicMaterial||f.isMeshLambertMaterial?s(p,f):f.isMeshToonMaterial?(s(p,f),h(p,f)):f.isMeshPhongMaterial?(s(p,f),u(p,f)):f.isMeshStandardMaterial?(s(p,f),d(p,f),f.isMeshPhysicalMaterial&&m(p,f,b)):f.isMeshMatcapMaterial?(s(p,f),g(p,f)):f.isMeshDepthMaterial?s(p,f):f.isMeshDistanceMaterial?(s(p,f),_(p,f)):f.isMeshNormalMaterial?s(p,f):f.isLineBasicMaterial?(a(p,f),f.isLineDashedMaterial&&o(p,f)):f.isPointsMaterial?l(p,f,y,x):f.isSpriteMaterial?c(p,f):f.isShadowMaterial?(p.color.value.copy(f.color),p.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function s(p,f){p.opacity.value=f.opacity,f.color&&p.diffuse.value.copy(f.color),f.emissive&&p.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.bumpMap&&(p.bumpMap.value=f.bumpMap,t(f.bumpMap,p.bumpMapTransform),p.bumpScale.value=f.bumpScale,f.side===Qt&&(p.bumpScale.value*=-1)),f.normalMap&&(p.normalMap.value=f.normalMap,t(f.normalMap,p.normalMapTransform),p.normalScale.value.copy(f.normalScale),f.side===Qt&&p.normalScale.value.negate()),f.displacementMap&&(p.displacementMap.value=f.displacementMap,t(f.displacementMap,p.displacementMapTransform),p.displacementScale.value=f.displacementScale,p.displacementBias.value=f.displacementBias),f.emissiveMap&&(p.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,p.emissiveMapTransform)),f.specularMap&&(p.specularMap.value=f.specularMap,t(f.specularMap,p.specularMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest);const y=e.get(f).envMap;if(y&&(p.envMap.value=y,p.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=f.reflectivity,p.ior.value=f.ior,p.refractionRatio.value=f.refractionRatio),f.lightMap){p.lightMap.value=f.lightMap;const x=i._useLegacyLights===!0?Math.PI:1;p.lightMapIntensity.value=f.lightMapIntensity*x,t(f.lightMap,p.lightMapTransform)}f.aoMap&&(p.aoMap.value=f.aoMap,p.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,p.aoMapTransform))}function a(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform))}function o(p,f){p.dashSize.value=f.dashSize,p.totalSize.value=f.dashSize+f.gapSize,p.scale.value=f.scale}function l(p,f,y,x){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.size.value=f.size*y,p.scale.value=x*.5,f.map&&(p.map.value=f.map,t(f.map,p.uvTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function c(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.rotation.value=f.rotation,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function u(p,f){p.specular.value.copy(f.specular),p.shininess.value=Math.max(f.shininess,1e-4)}function h(p,f){f.gradientMap&&(p.gradientMap.value=f.gradientMap)}function d(p,f){p.metalness.value=f.metalness,f.metalnessMap&&(p.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,p.metalnessMapTransform)),p.roughness.value=f.roughness,f.roughnessMap&&(p.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,p.roughnessMapTransform)),e.get(f).envMap&&(p.envMapIntensity.value=f.envMapIntensity)}function m(p,f,y){p.ior.value=f.ior,f.sheen>0&&(p.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),p.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(p.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,p.sheenColorMapTransform)),f.sheenRoughnessMap&&(p.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,p.sheenRoughnessMapTransform))),f.clearcoat>0&&(p.clearcoat.value=f.clearcoat,p.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(p.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,p.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(p.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===Qt&&p.clearcoatNormalScale.value.negate())),f.iridescence>0&&(p.iridescence.value=f.iridescence,p.iridescenceIOR.value=f.iridescenceIOR,p.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(p.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,p.iridescenceMapTransform)),f.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),f.transmission>0&&(p.transmission.value=f.transmission,p.transmissionSamplerMap.value=y.texture,p.transmissionSamplerSize.value.set(y.width,y.height),f.transmissionMap&&(p.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,p.transmissionMapTransform)),p.thickness.value=f.thickness,f.thicknessMap&&(p.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=f.attenuationDistance,p.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(p.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(p.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=f.specularIntensity,p.specularColor.value.copy(f.specularColor),f.specularColorMap&&(p.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,p.specularColorMapTransform)),f.specularIntensityMap&&(p.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,f){f.matcap&&(p.matcap.value=f.matcap)}function _(p,f){const y=e.get(f).light;p.referencePosition.value.setFromMatrixPosition(y.matrixWorld),p.nearDistance.value=y.shadow.camera.near,p.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function V_(i,e,t,n){let r={},s={},a=[];const o=t.isWebGL2?i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(y,x){const b=x.program;n.uniformBlockBinding(y,b)}function c(y,x){let b=r[y.id];b===void 0&&(g(y),b=u(y),r[y.id]=b,y.addEventListener("dispose",p));const L=x.program;n.updateUBOMapping(y,L);const P=e.render.frame;s[y.id]!==P&&(d(y),s[y.id]=P)}function u(y){const x=h();y.__bindingPointIndex=x;const b=i.createBuffer(),L=y.__size,P=y.usage;return i.bindBuffer(i.UNIFORM_BUFFER,b),i.bufferData(i.UNIFORM_BUFFER,L,P),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,x,b),b}function h(){for(let y=0;y<o;y++)if(a.indexOf(y)===-1)return a.push(y),y;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(y){const x=r[y.id],b=y.uniforms,L=y.__cache;i.bindBuffer(i.UNIFORM_BUFFER,x);for(let P=0,R=b.length;P<R;P++){const K=Array.isArray(b[P])?b[P]:[b[P]];for(let S=0,A=K.length;S<A;S++){const k=K[S];if(m(k,P,S,L)===!0){const X=k.__offset,oe=Array.isArray(k.value)?k.value:[k.value];let D=0;for(let z=0;z<oe.length;z++){const V=oe[z],j=_(V);typeof V=="number"||typeof V=="boolean"?(k.__data[0]=V,i.bufferSubData(i.UNIFORM_BUFFER,X+D,k.__data)):V.isMatrix3?(k.__data[0]=V.elements[0],k.__data[1]=V.elements[1],k.__data[2]=V.elements[2],k.__data[3]=0,k.__data[4]=V.elements[3],k.__data[5]=V.elements[4],k.__data[6]=V.elements[5],k.__data[7]=0,k.__data[8]=V.elements[6],k.__data[9]=V.elements[7],k.__data[10]=V.elements[8],k.__data[11]=0):(V.toArray(k.__data,D),D+=j.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,X,k.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(y,x,b,L){const P=y.value,R=x+"_"+b;if(L[R]===void 0)return typeof P=="number"||typeof P=="boolean"?L[R]=P:L[R]=P.clone(),!0;{const K=L[R];if(typeof P=="number"||typeof P=="boolean"){if(K!==P)return L[R]=P,!0}else if(K.equals(P)===!1)return K.copy(P),!0}return!1}function g(y){const x=y.uniforms;let b=0;const L=16;for(let R=0,K=x.length;R<K;R++){const S=Array.isArray(x[R])?x[R]:[x[R]];for(let A=0,k=S.length;A<k;A++){const X=S[A],oe=Array.isArray(X.value)?X.value:[X.value];for(let D=0,z=oe.length;D<z;D++){const V=oe[D],j=_(V),Y=b%L;Y!==0&&L-Y<j.boundary&&(b+=L-Y),X.__data=new Float32Array(j.storage/Float32Array.BYTES_PER_ELEMENT),X.__offset=b,b+=j.storage}}}const P=b%L;return P>0&&(b+=L-P),y.__size=b,y.__cache={},this}function _(y){const x={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(x.boundary=4,x.storage=4):y.isVector2?(x.boundary=8,x.storage=8):y.isVector3||y.isColor?(x.boundary=16,x.storage=12):y.isVector4?(x.boundary=16,x.storage=16):y.isMatrix3?(x.boundary=48,x.storage=48):y.isMatrix4?(x.boundary=64,x.storage=64):y.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",y),x}function p(y){const x=y.target;x.removeEventListener("dispose",p);const b=a.indexOf(x.__bindingPointIndex);a.splice(b,1),i.deleteBuffer(r[x.id]),delete r[x.id],delete s[x.id]}function f(){for(const y in r)i.deleteBuffer(r[y]);a=[],r={},s={}}return{bind:l,update:c,dispose:f}}class ja{constructor(e={}){const{canvas:t=Od(),context:n=null,depth:r=!0,stencil:s=!0,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1}=e;this.isWebGLRenderer=!0;let d;n!==null?d=n.getContextAttributes().alpha:d=a;const m=new Uint32Array(4),g=new Int32Array(4);let _=null,p=null;const f=[],y=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Lt,this._useLegacyLights=!1,this.toneMapping=fi,this.toneMappingExposure=1;const x=this;let b=!1,L=0,P=0,R=null,K=-1,S=null;const A=new gt,k=new gt;let X=null;const oe=new je(0);let D=0,z=t.width,V=t.height,j=1,Y=null,q=null;const $=new gt(0,0,z,V),se=new gt(0,0,z,V);let ae=!1;const G=new Xa;let Z=!1,he=!1,Se=null;const ve=new at,Fe=new Ne,Oe=new w,we={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function Ze(){return R===null?j:1}let F=n;function Ot(M,U){for(let B=0;B<M.length;B++){const H=M[B],O=t.getContext(H,U);if(O!==null)return O}return null}try{const M={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Ga}`),t.addEventListener("webglcontextlost",ee,!1),t.addEventListener("webglcontextrestored",C,!1),t.addEventListener("webglcontextcreationerror",re,!1),F===null){const U=["webgl2","webgl","experimental-webgl"];if(x.isWebGL1Renderer===!0&&U.shift(),F=Ot(U,M),F===null)throw Ot(U)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&F instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),F.getShaderPrecisionFormat===void 0&&(F.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let be,De,ge,ut,He,E,v,N,te,Q,ne,xe,ue,me,Ae,Ge,J,it,Xe,Ie,ye,de,T,ie;function Me(){be=new Jm(F),De=new Ym(F,be,e),be.init(De),de=new O_(F,be,De),ge=new N_(F,be,De),ut=new tg(F),He=new S_,E=new F_(F,be,ge,He,De,de,ut),v=new jm(x),N=new Zm(x),te=new cf(F,De),T=new Wm(F,be,te,De),Q=new Qm(F,te,ut,T),ne=new sg(F,Q,te,ut),Xe=new rg(F,De,E),Ge=new qm(He),xe=new M_(x,v,N,be,De,T,Ge),ue=new G_(x,He),me=new y_,Ae=new C_(be,De),it=new km(x,v,N,ge,ne,d,l),J=new U_(x,ne,De),ie=new V_(F,ut,De,ge),Ie=new Xm(F,be,ut,De),ye=new eg(F,be,ut,De),ut.programs=xe.programs,x.capabilities=De,x.extensions=be,x.properties=He,x.renderLists=me,x.shadowMap=J,x.state=ge,x.info=ut}Me();const pe=new H_(x,F);this.xr=pe,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){const M=be.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=be.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return j},this.setPixelRatio=function(M){M!==void 0&&(j=M,this.setSize(z,V,!1))},this.getSize=function(M){return M.set(z,V)},this.setSize=function(M,U,B=!0){if(pe.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}z=M,V=U,t.width=Math.floor(M*j),t.height=Math.floor(U*j),B===!0&&(t.style.width=M+"px",t.style.height=U+"px"),this.setViewport(0,0,M,U)},this.getDrawingBufferSize=function(M){return M.set(z*j,V*j).floor()},this.setDrawingBufferSize=function(M,U,B){z=M,V=U,j=B,t.width=Math.floor(M*B),t.height=Math.floor(U*B),this.setViewport(0,0,M,U)},this.getCurrentViewport=function(M){return M.copy(A)},this.getViewport=function(M){return M.copy($)},this.setViewport=function(M,U,B,H){M.isVector4?$.set(M.x,M.y,M.z,M.w):$.set(M,U,B,H),ge.viewport(A.copy($).multiplyScalar(j).floor())},this.getScissor=function(M){return M.copy(se)},this.setScissor=function(M,U,B,H){M.isVector4?se.set(M.x,M.y,M.z,M.w):se.set(M,U,B,H),ge.scissor(k.copy(se).multiplyScalar(j).floor())},this.getScissorTest=function(){return ae},this.setScissorTest=function(M){ge.setScissorTest(ae=M)},this.setOpaqueSort=function(M){Y=M},this.setTransparentSort=function(M){q=M},this.getClearColor=function(M){return M.copy(it.getClearColor())},this.setClearColor=function(){it.setClearColor.apply(it,arguments)},this.getClearAlpha=function(){return it.getClearAlpha()},this.setClearAlpha=function(){it.setClearAlpha.apply(it,arguments)},this.clear=function(M=!0,U=!0,B=!0){let H=0;if(M){let O=!1;if(R!==null){const fe=R.texture.format;O=fe===wu||fe===Au||fe===Tu}if(O){const fe=R.texture.type,Ee=fe===pi||fe===oi||fe===Va||fe===Ii||fe===yu||fe===bu,Ce=it.getClearColor(),Ue=it.getClearAlpha(),Ye=Ce.r,Be=Ce.g,Ve=Ce.b;Ee?(m[0]=Ye,m[1]=Be,m[2]=Ve,m[3]=Ue,F.clearBufferuiv(F.COLOR,0,m)):(g[0]=Ye,g[1]=Be,g[2]=Ve,g[3]=Ue,F.clearBufferiv(F.COLOR,0,g))}else H|=F.COLOR_BUFFER_BIT}U&&(H|=F.DEPTH_BUFFER_BIT),B&&(H|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F.clear(H)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ee,!1),t.removeEventListener("webglcontextrestored",C,!1),t.removeEventListener("webglcontextcreationerror",re,!1),me.dispose(),Ae.dispose(),He.dispose(),v.dispose(),N.dispose(),ne.dispose(),T.dispose(),ie.dispose(),xe.dispose(),pe.dispose(),pe.removeEventListener("sessionstart",yt),pe.removeEventListener("sessionend",tt),Se&&(Se.dispose(),Se=null),At.stop()};function ee(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),b=!0}function C(){console.log("THREE.WebGLRenderer: Context Restored."),b=!1;const M=ut.autoReset,U=J.enabled,B=J.autoUpdate,H=J.needsUpdate,O=J.type;Me(),ut.autoReset=M,J.enabled=U,J.autoUpdate=B,J.needsUpdate=H,J.type=O}function re(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function ce(M){const U=M.target;U.removeEventListener("dispose",ce),Re(U)}function Re(M){Te(M),He.remove(M)}function Te(M){const U=He.get(M).programs;U!==void 0&&(U.forEach(function(B){xe.releaseProgram(B)}),M.isShaderMaterial&&xe.releaseShaderCache(M))}this.renderBufferDirect=function(M,U,B,H,O,fe){U===null&&(U=we);const Ee=O.isMesh&&O.matrixWorld.determinant()<0,Ce=Lh(M,U,B,H,O);ge.setMaterial(H,Ee);let Ue=B.index,Ye=1;if(H.wireframe===!0){if(Ue=Q.getWireframeAttribute(B),Ue===void 0)return;Ye=2}const Be=B.drawRange,Ve=B.attributes.position;let bt=Be.start*Ye,an=(Be.start+Be.count)*Ye;fe!==null&&(bt=Math.max(bt,fe.start*Ye),an=Math.min(an,(fe.start+fe.count)*Ye)),Ue!==null?(bt=Math.max(bt,0),an=Math.min(an,Ue.count)):Ve!=null&&(bt=Math.max(bt,0),an=Math.min(an,Ve.count));const Nt=an-bt;if(Nt<0||Nt===1/0)return;T.setup(O,H,Ce,B,Ue);let Bn,_t=Ie;if(Ue!==null&&(Bn=te.get(Ue),_t=ye,_t.setIndex(Bn)),O.isMesh)H.wireframe===!0?(ge.setLineWidth(H.wireframeLinewidth*Ze()),_t.setMode(F.LINES)):_t.setMode(F.TRIANGLES);else if(O.isLine){let $e=H.linewidth;$e===void 0&&($e=1),ge.setLineWidth($e*Ze()),O.isLineSegments?_t.setMode(F.LINES):O.isLineLoop?_t.setMode(F.LINE_LOOP):_t.setMode(F.LINE_STRIP)}else O.isPoints?_t.setMode(F.POINTS):O.isSprite&&_t.setMode(F.TRIANGLES);if(O.isBatchedMesh)_t.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else if(O.isInstancedMesh)_t.renderInstances(bt,Nt,O.count);else if(B.isInstancedBufferGeometry){const $e=B._maxInstanceCount!==void 0?B._maxInstanceCount:1/0,vo=Math.min(B.instanceCount,$e);_t.renderInstances(bt,Nt,vo)}else _t.render(bt,Nt)};function Je(M,U,B){M.transparent===!0&&M.side===Rn&&M.forceSinglePass===!1?(M.side=Qt,M.needsUpdate=!0,ss(M,U,B),M.side=gi,M.needsUpdate=!0,ss(M,U,B),M.side=Rn):ss(M,U,B)}this.compile=function(M,U,B=null){B===null&&(B=M),p=Ae.get(B),p.init(),y.push(p),B.traverseVisible(function(O){O.isLight&&O.layers.test(U.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),M!==B&&M.traverseVisible(function(O){O.isLight&&O.layers.test(U.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),p.setupLights(x._useLegacyLights);const H=new Set;return M.traverse(function(O){const fe=O.material;if(fe)if(Array.isArray(fe))for(let Ee=0;Ee<fe.length;Ee++){const Ce=fe[Ee];Je(Ce,B,O),H.add(Ce)}else Je(fe,B,O),H.add(fe)}),y.pop(),p=null,H},this.compileAsync=function(M,U,B=null){const H=this.compile(M,U,B);return new Promise(O=>{function fe(){if(H.forEach(function(Ee){He.get(Ee).currentProgram.isReady()&&H.delete(Ee)}),H.size===0){O(M);return}setTimeout(fe,10)}be.get("KHR_parallel_shader_compile")!==null?fe():setTimeout(fe,10)})};let Qe=null;function St(M){Qe&&Qe(M)}function yt(){At.stop()}function tt(){At.start()}const At=new Vu;At.setAnimationLoop(St),typeof self<"u"&&At.setContext(self),this.setAnimationLoop=function(M){Qe=M,pe.setAnimationLoop(M),M===null?At.stop():At.start()},pe.addEventListener("sessionstart",yt),pe.addEventListener("sessionend",tt),this.render=function(M,U){if(U!==void 0&&U.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(b===!0)return;M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),pe.enabled===!0&&pe.isPresenting===!0&&(pe.cameraAutoUpdate===!0&&pe.updateCamera(U),U=pe.getCamera()),M.isScene===!0&&M.onBeforeRender(x,M,U,R),p=Ae.get(M,y.length),p.init(),y.push(p),ve.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),G.setFromProjectionMatrix(ve),he=this.localClippingEnabled,Z=Ge.init(this.clippingPlanes,he),_=me.get(M,f.length),_.init(),f.push(_),Ln(M,U,0,x.sortObjects),_.finish(),x.sortObjects===!0&&_.sort(Y,q),this.info.render.frame++,Z===!0&&Ge.beginShadows();const B=p.state.shadowsArray;if(J.render(B,M,U),Z===!0&&Ge.endShadows(),this.info.autoReset===!0&&this.info.reset(),it.render(_,M),p.setupLights(x._useLegacyLights),U.isArrayCamera){const H=U.cameras;for(let O=0,fe=H.length;O<fe;O++){const Ee=H[O];rl(_,M,Ee,Ee.viewport)}}else rl(_,M,U);R!==null&&(E.updateMultisampleRenderTarget(R),E.updateRenderTargetMipmap(R)),M.isScene===!0&&M.onAfterRender(x,M,U),T.resetDefaultState(),K=-1,S=null,y.pop(),y.length>0?p=y[y.length-1]:p=null,f.pop(),f.length>0?_=f[f.length-1]:_=null};function Ln(M,U,B,H){if(M.visible===!1)return;if(M.layers.test(U.layers)){if(M.isGroup)B=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(U);else if(M.isLight)p.pushLight(M),M.castShadow&&p.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||G.intersectsSprite(M)){H&&Oe.setFromMatrixPosition(M.matrixWorld).applyMatrix4(ve);const Ee=ne.update(M),Ce=M.material;Ce.visible&&_.push(M,Ee,Ce,B,Oe.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||G.intersectsObject(M))){const Ee=ne.update(M),Ce=M.material;if(H&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Oe.copy(M.boundingSphere.center)):(Ee.boundingSphere===null&&Ee.computeBoundingSphere(),Oe.copy(Ee.boundingSphere.center)),Oe.applyMatrix4(M.matrixWorld).applyMatrix4(ve)),Array.isArray(Ce)){const Ue=Ee.groups;for(let Ye=0,Be=Ue.length;Ye<Be;Ye++){const Ve=Ue[Ye],bt=Ce[Ve.materialIndex];bt&&bt.visible&&_.push(M,Ee,bt,B,Oe.z,Ve)}}else Ce.visible&&_.push(M,Ee,Ce,B,Oe.z,null)}}const fe=M.children;for(let Ee=0,Ce=fe.length;Ee<Ce;Ee++)Ln(fe[Ee],U,B,H)}function rl(M,U,B,H){const O=M.opaque,fe=M.transmissive,Ee=M.transparent;p.setupLightsView(B),Z===!0&&Ge.setGlobalState(x.clippingPlanes,B),fe.length>0&&Ph(O,fe,U,B),H&&ge.viewport(A.copy(H)),O.length>0&&rs(O,U,B),fe.length>0&&rs(fe,U,B),Ee.length>0&&rs(Ee,U,B),ge.buffers.depth.setTest(!0),ge.buffers.depth.setMask(!0),ge.buffers.color.setMask(!0),ge.setPolygonOffset(!1)}function Ph(M,U,B,H){if((B.isScene===!0?B.overrideMaterial:null)!==null)return;const fe=De.isWebGL2;Se===null&&(Se=new Fi(1,1,{generateMipmaps:!0,type:be.has("EXT_color_buffer_half_float")?jr:pi,minFilter:qr,samples:fe?4:0})),x.getDrawingBufferSize(Fe),fe?Se.setSize(Fe.x,Fe.y):Se.setSize(Ea(Fe.x),Ea(Fe.y));const Ee=x.getRenderTarget();x.setRenderTarget(Se),x.getClearColor(oe),D=x.getClearAlpha(),D<1&&x.setClearColor(16777215,.5),x.clear();const Ce=x.toneMapping;x.toneMapping=fi,rs(M,B,H),E.updateMultisampleRenderTarget(Se),E.updateRenderTargetMipmap(Se);let Ue=!1;for(let Ye=0,Be=U.length;Ye<Be;Ye++){const Ve=U[Ye],bt=Ve.object,an=Ve.geometry,Nt=Ve.material,Bn=Ve.group;if(Nt.side===Rn&&bt.layers.test(H.layers)){const _t=Nt.side;Nt.side=Qt,Nt.needsUpdate=!0,sl(bt,B,H,an,Nt,Bn),Nt.side=_t,Nt.needsUpdate=!0,Ue=!0}}Ue===!0&&(E.updateMultisampleRenderTarget(Se),E.updateRenderTargetMipmap(Se)),x.setRenderTarget(Ee),x.setClearColor(oe,D),x.toneMapping=Ce}function rs(M,U,B){const H=U.isScene===!0?U.overrideMaterial:null;for(let O=0,fe=M.length;O<fe;O++){const Ee=M[O],Ce=Ee.object,Ue=Ee.geometry,Ye=H===null?Ee.material:H,Be=Ee.group;Ce.layers.test(B.layers)&&sl(Ce,U,B,Ue,Ye,Be)}}function sl(M,U,B,H,O,fe){M.onBeforeRender(x,U,B,H,O,fe),M.modelViewMatrix.multiplyMatrices(B.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),O.onBeforeRender(x,U,B,H,M,fe),O.transparent===!0&&O.side===Rn&&O.forceSinglePass===!1?(O.side=Qt,O.needsUpdate=!0,x.renderBufferDirect(B,U,H,O,M,fe),O.side=gi,O.needsUpdate=!0,x.renderBufferDirect(B,U,H,O,M,fe),O.side=Rn):x.renderBufferDirect(B,U,H,O,M,fe),M.onAfterRender(x,U,B,H,O,fe)}function ss(M,U,B){U.isScene!==!0&&(U=we);const H=He.get(M),O=p.state.lights,fe=p.state.shadowsArray,Ee=O.state.version,Ce=xe.getParameters(M,O.state,fe,U,B),Ue=xe.getProgramCacheKey(Ce);let Ye=H.programs;H.environment=M.isMeshStandardMaterial?U.environment:null,H.fog=U.fog,H.envMap=(M.isMeshStandardMaterial?N:v).get(M.envMap||H.environment),Ye===void 0&&(M.addEventListener("dispose",ce),Ye=new Map,H.programs=Ye);let Be=Ye.get(Ue);if(Be!==void 0){if(H.currentProgram===Be&&H.lightsStateVersion===Ee)return al(M,Ce),Be}else Ce.uniforms=xe.getUniforms(M),M.onBuild(B,Ce,x),M.onBeforeCompile(Ce,x),Be=xe.acquireProgram(Ce,Ue),Ye.set(Ue,Be),H.uniforms=Ce.uniforms;const Ve=H.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ve.clippingPlanes=Ge.uniform),al(M,Ce),H.needsLights=Ih(M),H.lightsStateVersion=Ee,H.needsLights&&(Ve.ambientLightColor.value=O.state.ambient,Ve.lightProbe.value=O.state.probe,Ve.directionalLights.value=O.state.directional,Ve.directionalLightShadows.value=O.state.directionalShadow,Ve.spotLights.value=O.state.spot,Ve.spotLightShadows.value=O.state.spotShadow,Ve.rectAreaLights.value=O.state.rectArea,Ve.ltc_1.value=O.state.rectAreaLTC1,Ve.ltc_2.value=O.state.rectAreaLTC2,Ve.pointLights.value=O.state.point,Ve.pointLightShadows.value=O.state.pointShadow,Ve.hemisphereLights.value=O.state.hemi,Ve.directionalShadowMap.value=O.state.directionalShadowMap,Ve.directionalShadowMatrix.value=O.state.directionalShadowMatrix,Ve.spotShadowMap.value=O.state.spotShadowMap,Ve.spotLightMatrix.value=O.state.spotLightMatrix,Ve.spotLightMap.value=O.state.spotLightMap,Ve.pointShadowMap.value=O.state.pointShadowMap,Ve.pointShadowMatrix.value=O.state.pointShadowMatrix),H.currentProgram=Be,H.uniformsList=null,Be}function ol(M){if(M.uniformsList===null){const U=M.currentProgram.getUniforms();M.uniformsList=Bs.seqWithValue(U.seq,M.uniforms)}return M.uniformsList}function al(M,U){const B=He.get(M);B.outputColorSpace=U.outputColorSpace,B.batching=U.batching,B.instancing=U.instancing,B.instancingColor=U.instancingColor,B.skinning=U.skinning,B.morphTargets=U.morphTargets,B.morphNormals=U.morphNormals,B.morphColors=U.morphColors,B.morphTargetsCount=U.morphTargetsCount,B.numClippingPlanes=U.numClippingPlanes,B.numIntersection=U.numClipIntersection,B.vertexAlphas=U.vertexAlphas,B.vertexTangents=U.vertexTangents,B.toneMapping=U.toneMapping}function Lh(M,U,B,H,O){U.isScene!==!0&&(U=we),E.resetTextureUnits();const fe=U.fog,Ee=H.isMeshStandardMaterial?U.environment:null,Ce=R===null?x.outputColorSpace:R.isXRRenderTarget===!0?R.texture.colorSpace:$n,Ue=(H.isMeshStandardMaterial?N:v).get(H.envMap||Ee),Ye=H.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,Be=!!B.attributes.tangent&&(!!H.normalMap||H.anisotropy>0),Ve=!!B.morphAttributes.position,bt=!!B.morphAttributes.normal,an=!!B.morphAttributes.color;let Nt=fi;H.toneMapped&&(R===null||R.isXRRenderTarget===!0)&&(Nt=x.toneMapping);const Bn=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,_t=Bn!==void 0?Bn.length:0,$e=He.get(H),vo=p.state.lights;if(Z===!0&&(he===!0||M!==S)){const fn=M===S&&H.id===K;Ge.setState(H,M,fn)}let Et=!1;H.version===$e.__version?($e.needsLights&&$e.lightsStateVersion!==vo.state.version||$e.outputColorSpace!==Ce||O.isBatchedMesh&&$e.batching===!1||!O.isBatchedMesh&&$e.batching===!0||O.isInstancedMesh&&$e.instancing===!1||!O.isInstancedMesh&&$e.instancing===!0||O.isSkinnedMesh&&$e.skinning===!1||!O.isSkinnedMesh&&$e.skinning===!0||O.isInstancedMesh&&$e.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&$e.instancingColor===!1&&O.instanceColor!==null||$e.envMap!==Ue||H.fog===!0&&$e.fog!==fe||$e.numClippingPlanes!==void 0&&($e.numClippingPlanes!==Ge.numPlanes||$e.numIntersection!==Ge.numIntersection)||$e.vertexAlphas!==Ye||$e.vertexTangents!==Be||$e.morphTargets!==Ve||$e.morphNormals!==bt||$e.morphColors!==an||$e.toneMapping!==Nt||De.isWebGL2===!0&&$e.morphTargetsCount!==_t)&&(Et=!0):(Et=!0,$e.__version=H.version);let Si=$e.currentProgram;Et===!0&&(Si=ss(H,U,O));let ll=!1,Lr=!1,Mo=!1;const Vt=Si.getUniforms(),Ei=$e.uniforms;if(ge.useProgram(Si.program)&&(ll=!0,Lr=!0,Mo=!0),H.id!==K&&(K=H.id,Lr=!0),ll||S!==M){Vt.setValue(F,"projectionMatrix",M.projectionMatrix),Vt.setValue(F,"viewMatrix",M.matrixWorldInverse);const fn=Vt.map.cameraPosition;fn!==void 0&&fn.setValue(F,Oe.setFromMatrixPosition(M.matrixWorld)),De.logarithmicDepthBuffer&&Vt.setValue(F,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial)&&Vt.setValue(F,"isOrthographic",M.isOrthographicCamera===!0),S!==M&&(S=M,Lr=!0,Mo=!0)}if(O.isSkinnedMesh){Vt.setOptional(F,O,"bindMatrix"),Vt.setOptional(F,O,"bindMatrixInverse");const fn=O.skeleton;fn&&(De.floatVertexTextures?(fn.boneTexture===null&&fn.computeBoneTexture(),Vt.setValue(F,"boneTexture",fn.boneTexture,E)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}O.isBatchedMesh&&(Vt.setOptional(F,O,"batchingTexture"),Vt.setValue(F,"batchingTexture",O._matricesTexture,E));const So=B.morphAttributes;if((So.position!==void 0||So.normal!==void 0||So.color!==void 0&&De.isWebGL2===!0)&&Xe.update(O,B,Si),(Lr||$e.receiveShadow!==O.receiveShadow)&&($e.receiveShadow=O.receiveShadow,Vt.setValue(F,"receiveShadow",O.receiveShadow)),H.isMeshGouraudMaterial&&H.envMap!==null&&(Ei.envMap.value=Ue,Ei.flipEnvMap.value=Ue.isCubeTexture&&Ue.isRenderTargetTexture===!1?-1:1),Lr&&(Vt.setValue(F,"toneMappingExposure",x.toneMappingExposure),$e.needsLights&&Dh(Ei,Mo),fe&&H.fog===!0&&ue.refreshFogUniforms(Ei,fe),ue.refreshMaterialUniforms(Ei,H,j,V,Se),Bs.upload(F,ol($e),Ei,E)),H.isShaderMaterial&&H.uniformsNeedUpdate===!0&&(Bs.upload(F,ol($e),Ei,E),H.uniformsNeedUpdate=!1),H.isSpriteMaterial&&Vt.setValue(F,"center",O.center),Vt.setValue(F,"modelViewMatrix",O.modelViewMatrix),Vt.setValue(F,"normalMatrix",O.normalMatrix),Vt.setValue(F,"modelMatrix",O.matrixWorld),H.isShaderMaterial||H.isRawShaderMaterial){const fn=H.uniformsGroups;for(let Eo=0,Uh=fn.length;Eo<Uh;Eo++)if(De.isWebGL2){const cl=fn[Eo];ie.update(cl,Si),ie.bind(cl,Si)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return Si}function Dh(M,U){M.ambientLightColor.needsUpdate=U,M.lightProbe.needsUpdate=U,M.directionalLights.needsUpdate=U,M.directionalLightShadows.needsUpdate=U,M.pointLights.needsUpdate=U,M.pointLightShadows.needsUpdate=U,M.spotLights.needsUpdate=U,M.spotLightShadows.needsUpdate=U,M.rectAreaLights.needsUpdate=U,M.hemisphereLights.needsUpdate=U}function Ih(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return L},this.getActiveMipmapLevel=function(){return P},this.getRenderTarget=function(){return R},this.setRenderTargetTextures=function(M,U,B){He.get(M.texture).__webglTexture=U,He.get(M.depthTexture).__webglTexture=B;const H=He.get(M);H.__hasExternalTextures=!0,H.__hasExternalTextures&&(H.__autoAllocateDepthBuffer=B===void 0,H.__autoAllocateDepthBuffer||be.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),H.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(M,U){const B=He.get(M);B.__webglFramebuffer=U,B.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(M,U=0,B=0){R=M,L=U,P=B;let H=!0,O=null,fe=!1,Ee=!1;if(M){const Ue=He.get(M);Ue.__useDefaultFramebuffer!==void 0?(ge.bindFramebuffer(F.FRAMEBUFFER,null),H=!1):Ue.__webglFramebuffer===void 0?E.setupRenderTarget(M):Ue.__hasExternalTextures&&E.rebindTextures(M,He.get(M.texture).__webglTexture,He.get(M.depthTexture).__webglTexture);const Ye=M.texture;(Ye.isData3DTexture||Ye.isDataArrayTexture||Ye.isCompressedArrayTexture)&&(Ee=!0);const Be=He.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Be[U])?O=Be[U][B]:O=Be[U],fe=!0):De.isWebGL2&&M.samples>0&&E.useMultisampledRTT(M)===!1?O=He.get(M).__webglMultisampledFramebuffer:Array.isArray(Be)?O=Be[B]:O=Be,A.copy(M.viewport),k.copy(M.scissor),X=M.scissorTest}else A.copy($).multiplyScalar(j).floor(),k.copy(se).multiplyScalar(j).floor(),X=ae;if(ge.bindFramebuffer(F.FRAMEBUFFER,O)&&De.drawBuffers&&H&&ge.drawBuffers(M,O),ge.viewport(A),ge.scissor(k),ge.setScissorTest(X),fe){const Ue=He.get(M.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+U,Ue.__webglTexture,B)}else if(Ee){const Ue=He.get(M.texture),Ye=U||0;F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,Ue.__webglTexture,B||0,Ye)}K=-1},this.readRenderTargetPixels=function(M,U,B,H,O,fe,Ee){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ce=He.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&Ee!==void 0&&(Ce=Ce[Ee]),Ce){ge.bindFramebuffer(F.FRAMEBUFFER,Ce);try{const Ue=M.texture,Ye=Ue.format,Be=Ue.type;if(Ye!==Pn&&de.convert(Ye)!==F.getParameter(F.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Ve=Be===jr&&(be.has("EXT_color_buffer_half_float")||De.isWebGL2&&be.has("EXT_color_buffer_float"));if(Be!==pi&&de.convert(Be)!==F.getParameter(F.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Be===ai&&(De.isWebGL2||be.has("OES_texture_float")||be.has("WEBGL_color_buffer_float")))&&!Ve){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=M.width-H&&B>=0&&B<=M.height-O&&F.readPixels(U,B,H,O,de.convert(Ye),de.convert(Be),fe)}finally{const Ue=R!==null?He.get(R).__webglFramebuffer:null;ge.bindFramebuffer(F.FRAMEBUFFER,Ue)}}},this.copyFramebufferToTexture=function(M,U,B=0){const H=Math.pow(2,-B),O=Math.floor(U.image.width*H),fe=Math.floor(U.image.height*H);E.setTexture2D(U,0),F.copyTexSubImage2D(F.TEXTURE_2D,B,0,0,M.x,M.y,O,fe),ge.unbindTexture()},this.copyTextureToTexture=function(M,U,B,H=0){const O=U.image.width,fe=U.image.height,Ee=de.convert(B.format),Ce=de.convert(B.type);E.setTexture2D(B,0),F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,B.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,B.unpackAlignment),U.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,H,M.x,M.y,O,fe,Ee,Ce,U.image.data):U.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,H,M.x,M.y,U.mipmaps[0].width,U.mipmaps[0].height,Ee,U.mipmaps[0].data):F.texSubImage2D(F.TEXTURE_2D,H,M.x,M.y,Ee,Ce,U.image),H===0&&B.generateMipmaps&&F.generateMipmap(F.TEXTURE_2D),ge.unbindTexture()},this.copyTextureToTexture3D=function(M,U,B,H,O=0){if(x.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const fe=M.max.x-M.min.x+1,Ee=M.max.y-M.min.y+1,Ce=M.max.z-M.min.z+1,Ue=de.convert(H.format),Ye=de.convert(H.type);let Be;if(H.isData3DTexture)E.setTexture3D(H,0),Be=F.TEXTURE_3D;else if(H.isDataArrayTexture||H.isCompressedArrayTexture)E.setTexture2DArray(H,0),Be=F.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,H.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,H.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,H.unpackAlignment);const Ve=F.getParameter(F.UNPACK_ROW_LENGTH),bt=F.getParameter(F.UNPACK_IMAGE_HEIGHT),an=F.getParameter(F.UNPACK_SKIP_PIXELS),Nt=F.getParameter(F.UNPACK_SKIP_ROWS),Bn=F.getParameter(F.UNPACK_SKIP_IMAGES),_t=B.isCompressedTexture?B.mipmaps[O]:B.image;F.pixelStorei(F.UNPACK_ROW_LENGTH,_t.width),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,_t.height),F.pixelStorei(F.UNPACK_SKIP_PIXELS,M.min.x),F.pixelStorei(F.UNPACK_SKIP_ROWS,M.min.y),F.pixelStorei(F.UNPACK_SKIP_IMAGES,M.min.z),B.isDataTexture||B.isData3DTexture?F.texSubImage3D(Be,O,U.x,U.y,U.z,fe,Ee,Ce,Ue,Ye,_t.data):B.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),F.compressedTexSubImage3D(Be,O,U.x,U.y,U.z,fe,Ee,Ce,Ue,_t.data)):F.texSubImage3D(Be,O,U.x,U.y,U.z,fe,Ee,Ce,Ue,Ye,_t),F.pixelStorei(F.UNPACK_ROW_LENGTH,Ve),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,bt),F.pixelStorei(F.UNPACK_SKIP_PIXELS,an),F.pixelStorei(F.UNPACK_SKIP_ROWS,Nt),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Bn),O===0&&H.generateMipmaps&&F.generateMipmap(Be),ge.unbindTexture()},this.initTexture=function(M){M.isCubeTexture?E.setTextureCube(M,0):M.isData3DTexture?E.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?E.setTexture2DArray(M,0):E.setTexture2D(M,0),ge.unbindTexture()},this.resetState=function(){L=0,P=0,R=null,ge.reset(),T.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return qn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=e===ka?"display-p3":"srgb",t.unpackColorSpace=st.workingColorSpace===lo?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===Lt?Ni:Cu}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===Ni?Lt:$n}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=e}}class k_ extends ja{}k_.prototype.isWebGL1Renderer=!0;class $a extends Dt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}}class Cc extends hn{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const cr=new at,Pc=new at,Rs=[],Lc=new ki,W_=new at,Or=new ct,Br=new Rr;class X_ extends ct{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Cc(new Float32Array(n*16),16),this.instanceColor=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<n;r++)this.setMatrixAt(r,W_)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new ki),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,cr),Lc.copy(e.boundingBox).applyMatrix4(cr),this.boundingBox.union(Lc)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Rr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,cr),Br.copy(e.boundingSphere).applyMatrix4(cr),this.boundingSphere.union(Br)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}raycast(e,t){const n=this.matrixWorld,r=this.count;if(Or.geometry=this.geometry,Or.material=this.material,Or.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Br.copy(this.boundingSphere),Br.applyMatrix4(n),e.ray.intersectsSphere(Br)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,cr),Pc.multiplyMatrices(n,cr),Or.matrixWorld=Pc,Or.raycast(e,Rs);for(let a=0,o=Rs.length;a<o;a++){const l=Rs[a];l.instanceId=s,l.object=this,t.push(l)}Rs.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Cc(new Float32Array(this.instanceMatrix.count*3),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class Bi extends Cr{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new je(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Dc=new w,Ic=new w,Uc=new at,Qo=new co,Cs=new Rr;class Ta extends Dt{constructor(e=new jt,t=new Bi){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let r=1,s=t.count;r<s;r++)Dc.fromBufferAttribute(t,r-1),Ic.fromBufferAttribute(t,r),n[r]=n[r-1],n[r]+=Dc.distanceTo(Ic);e.setAttribute("lineDistance",new Ht(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const n=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Cs.copy(n.boundingSphere),Cs.applyMatrix4(r),Cs.radius+=s,e.ray.intersectsSphere(Cs)===!1)return;Uc.copy(r).invert(),Qo.copy(e.ray).applyMatrix4(Uc);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=new w,u=new w,h=new w,d=new w,m=this.isLineSegments?2:1,g=n.index,p=n.attributes.position;if(g!==null){const f=Math.max(0,a.start),y=Math.min(g.count,a.start+a.count);for(let x=f,b=y-1;x<b;x+=m){const L=g.getX(x),P=g.getX(x+1);if(c.fromBufferAttribute(p,L),u.fromBufferAttribute(p,P),Qo.distanceSqToSegment(c,u,d,h)>l)continue;d.applyMatrix4(this.matrixWorld);const K=e.ray.origin.distanceTo(d);K<e.near||K>e.far||t.push({distance:K,point:h.clone().applyMatrix4(this.matrixWorld),index:x,face:null,faceIndex:null,object:this})}}else{const f=Math.max(0,a.start),y=Math.min(p.count,a.start+a.count);for(let x=f,b=y-1;x<b;x+=m){if(c.fromBufferAttribute(p,x),u.fromBufferAttribute(p,x+1),Qo.distanceSqToSegment(c,u,d,h)>l)continue;d.applyMatrix4(this.matrixWorld);const P=e.ray.origin.distanceTo(d);P<e.near||P>e.far||t.push({distance:P,point:h.clone().applyMatrix4(this.matrixWorld),index:x,face:null,faceIndex:null,object:this})}}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}const Nc=new w,Fc=new w;class ho extends Ta{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[];for(let r=0,s=t.count;r<s;r+=2)Nc.fromBufferAttribute(t,r),Fc.fromBufferAttribute(t,r+1),n[r]=r===0?0:n[r-1],n[r+1]=n[r]+Nc.distanceTo(Fc);e.setAttribute("lineDistance",new Ht(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Ka extends jt{constructor(e=1,t=32,n=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const u=[],h=new w,d=new w,m=[],g=[],_=[],p=[];for(let f=0;f<=n;f++){const y=[],x=f/n;let b=0;f===0&&a===0?b=.5/t:f===n&&l===Math.PI&&(b=-.5/t);for(let L=0;L<=t;L++){const P=L/t;h.x=-e*Math.cos(r+P*s)*Math.sin(a+x*o),h.y=e*Math.cos(a+x*o),h.z=e*Math.sin(r+P*s)*Math.sin(a+x*o),g.push(h.x,h.y,h.z),d.copy(h).normalize(),_.push(d.x,d.y,d.z),p.push(P+b,1-x),y.push(c++)}u.push(y)}for(let f=0;f<n;f++)for(let y=0;y<t;y++){const x=u[f][y+1],b=u[f][y],L=u[f+1][y],P=u[f+1][y+1];(f!==0||a>0)&&m.push(x,b,P),(f!==n-1||l<Math.PI)&&m.push(b,L,P)}this.setIndex(m),this.setAttribute("position",new Ht(g,3)),this.setAttribute("normal",new Ht(_,3)),this.setAttribute("uv",new Ht(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ka(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class $s extends Cr{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new je(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new je(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Pu,this.normalScale=new Ne(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class fo extends Dt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new je(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}class Ku extends fo{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Dt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new je(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const ea=new at,Oc=new w,Bc=new w;class Zu{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ne(512,512),this.map=null,this.mapPass=null,this.matrix=new at,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Xa,this._frameExtents=new Ne(1,1),this._viewportCount=1,this._viewports=[new gt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;Oc.setFromMatrixPosition(e.matrixWorld),t.position.copy(Oc),Bc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Bc),t.updateMatrixWorld(),ea.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ea),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(ea)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const zc=new at,zr=new w,ta=new w;class Y_ extends Zu{constructor(){super(new sn(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Ne(4,2),this._viewportCount=6,this._viewports=[new gt(2,1,1,1),new gt(0,1,1,1),new gt(3,1,1,1),new gt(1,1,1,1),new gt(3,0,1,1),new gt(1,0,1,1)],this._cubeDirections=[new w(1,0,0),new w(-1,0,0),new w(0,0,1),new w(0,0,-1),new w(0,1,0),new w(0,-1,0)],this._cubeUps=[new w(0,1,0),new w(0,1,0),new w(0,1,0),new w(0,1,0),new w(0,0,1),new w(0,0,-1)]}updateMatrices(e,t=0){const n=this.camera,r=this.matrix,s=e.distance||n.far;s!==n.far&&(n.far=s,n.updateProjectionMatrix()),zr.setFromMatrixPosition(e.matrixWorld),n.position.copy(zr),ta.copy(n.position),ta.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(ta),n.updateMatrixWorld(),r.makeTranslation(-zr.x,-zr.y,-zr.z),zc.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(zc)}}class q_ extends fo{constructor(e,t,n=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=r,this.shadow=new Y_}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}}class j_ extends Zu{constructor(){super(new ku(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Ju extends fo{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Dt.DEFAULT_UP),this.updateMatrix(),this.target=new Dt,this.shadow=new j_}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class Qu extends fo{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}}class $_{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Hc(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=Hc();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}function Hc(){return(typeof performance>"u"?Date:performance).now()}class K_{constructor(e,t,n=0,r=1/0){this.ray=new co(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new Wa,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}intersectObject(e,t=!0,n=[]){return Aa(e,this,n,t),n.sort(Gc),n}intersectObjects(e,t=!0,n=[]){for(let r=0,s=e.length;r<s;r++)Aa(e[r],this,n,t);return n.sort(Gc),n}}function Gc(i,e){return i.distance-e.distance}function Aa(i,e,t,n){if(i.layers.test(e.layers)&&i.raycast(e,t),n===!0){const r=i.children;for(let s=0,a=r.length;s<a;s++)Aa(r[s],e,t,!0)}}class wa{constructor(e=1,t=0,n=0){return this.radius=e,this.phi=t,this.theta=n,this}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Yt(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const Vc=new w,Ps=new w;class Z_{constructor(e=new w,t=new w){this.start=e,this.end=t}set(e,t){return this.start.copy(e),this.end.copy(t),this}copy(e){return this.start.copy(e.start),this.end.copy(e.end),this}getCenter(e){return e.addVectors(this.start,this.end).multiplyScalar(.5)}delta(e){return e.subVectors(this.end,this.start)}distanceSq(){return this.start.distanceToSquared(this.end)}distance(){return this.start.distanceTo(this.end)}at(e,t){return this.delta(t).multiplyScalar(e).add(this.start)}closestPointToPointParameter(e,t){Vc.subVectors(e,this.start),Ps.subVectors(this.end,this.start);const n=Ps.dot(Ps);let s=Ps.dot(Vc)/n;return t&&(s=Yt(s,0,1)),s}closestPointToPoint(e,t,n){const r=this.closestPointToPointParameter(e,t);return this.delta(n).multiplyScalar(r).add(this.start)}applyMatrix4(e){return this.start.applyMatrix4(e),this.end.applyMatrix4(e),this}equals(e){return e.start.equals(this.start)&&e.end.equals(this.end)}clone(){return new this.constructor().copy(this)}}class J_ extends ho{constructor(e=1){const t=[0,0,0,e,0,0,0,0,0,0,e,0,0,0,0,0,0,e],n=[1,0,0,1,.6,0,0,1,0,.6,1,0,0,0,1,0,.6,1],r=new jt;r.setAttribute("position",new Ht(t,3)),r.setAttribute("color",new Ht(n,3));const s=new Bi({vertexColors:!0,toneMapped:!1});super(r,s),this.type="AxesHelper"}setColors(e,t,n){const r=new je,s=this.geometry.attributes.color.array;return r.set(e),r.toArray(s,0),r.toArray(s,3),r.set(t),r.toArray(s,6),r.toArray(s,9),r.set(n),r.toArray(s,12),r.toArray(s,15),this.geometry.attributes.color.needsUpdate=!0,this}dispose(){this.geometry.dispose(),this.material.dispose()}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ga}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ga);const kc={type:"change"},na={type:"start"},Wc={type:"end"},Ls=new co,Xc=new An,Q_=Math.cos(70*Fd.DEG2RAD);class ex extends Vi{constructor(e,t){super(),this.object=e,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new w,this.cursor=new w,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Xi.ROTATE,MIDDLE:Xi.DOLLY,RIGHT:Xi.PAN},this.touches={ONE:Yi.ROTATE,TWO:Yi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this.getPolarAngle=function(){return o.phi},this.getAzimuthalAngle=function(){return o.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(T){T.addEventListener("keydown",Ae),this._domElementKeyEvents=T},this.stopListenToKeyEvents=function(){this._domElementKeyEvents.removeEventListener("keydown",Ae),this._domElementKeyEvents=null},this.saveState=function(){n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=function(){n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(kc),n.update(),s=r.NONE},this.update=function(){const T=new w,ie=new On().setFromUnitVectors(e.up,new w(0,1,0)),Me=ie.clone().invert(),pe=new w,ee=new On,C=new w,re=2*Math.PI;return function(Re=null){const Te=n.object.position;T.copy(Te).sub(n.target),T.applyQuaternion(ie),o.setFromVector3(T),n.autoRotate&&s===r.NONE&&X(A(Re)),n.enableDamping?(o.theta+=l.theta*n.dampingFactor,o.phi+=l.phi*n.dampingFactor):(o.theta+=l.theta,o.phi+=l.phi);let Je=n.minAzimuthAngle,Qe=n.maxAzimuthAngle;isFinite(Je)&&isFinite(Qe)&&(Je<-Math.PI?Je+=re:Je>Math.PI&&(Je-=re),Qe<-Math.PI?Qe+=re:Qe>Math.PI&&(Qe-=re),Je<=Qe?o.theta=Math.max(Je,Math.min(Qe,o.theta)):o.theta=o.theta>(Je+Qe)/2?Math.max(Je,o.theta):Math.min(Qe,o.theta)),o.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,o.phi)),o.makeSafe(),n.enableDamping===!0?n.target.addScaledVector(u,n.dampingFactor):n.target.add(u),n.target.sub(n.cursor),n.target.clampLength(n.minTargetRadius,n.maxTargetRadius),n.target.add(n.cursor),n.zoomToCursor&&P||n.object.isOrthographicCamera?o.radius=$(o.radius):o.radius=$(o.radius*c),T.setFromSpherical(o),T.applyQuaternion(Me),Te.copy(n.target).add(T),n.object.lookAt(n.target),n.enableDamping===!0?(l.theta*=1-n.dampingFactor,l.phi*=1-n.dampingFactor,u.multiplyScalar(1-n.dampingFactor)):(l.set(0,0,0),u.set(0,0,0));let St=!1;if(n.zoomToCursor&&P){let yt=null;if(n.object.isPerspectiveCamera){const tt=T.length();yt=$(tt*c);const At=tt-yt;n.object.position.addScaledVector(b,At),n.object.updateMatrixWorld()}else if(n.object.isOrthographicCamera){const tt=new w(L.x,L.y,0);tt.unproject(n.object),n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/c)),n.object.updateProjectionMatrix(),St=!0;const At=new w(L.x,L.y,0);At.unproject(n.object),n.object.position.sub(At).add(tt),n.object.updateMatrixWorld(),yt=T.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),n.zoomToCursor=!1;yt!==null&&(this.screenSpacePanning?n.target.set(0,0,-1).transformDirection(n.object.matrix).multiplyScalar(yt).add(n.object.position):(Ls.origin.copy(n.object.position),Ls.direction.set(0,0,-1).transformDirection(n.object.matrix),Math.abs(n.object.up.dot(Ls.direction))<Q_?e.lookAt(n.target):(Xc.setFromNormalAndCoplanarPoint(n.object.up,n.target),Ls.intersectPlane(Xc,n.target))))}else n.object.isOrthographicCamera&&(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/c)),n.object.updateProjectionMatrix(),St=!0);return c=1,P=!1,St||pe.distanceToSquared(n.object.position)>a||8*(1-ee.dot(n.object.quaternion))>a||C.distanceToSquared(n.target)>0?(n.dispatchEvent(kc),pe.copy(n.object.position),ee.copy(n.object.quaternion),C.copy(n.target),!0):!1}}(),this.dispose=function(){n.domElement.removeEventListener("contextmenu",it),n.domElement.removeEventListener("pointerdown",E),n.domElement.removeEventListener("pointercancel",N),n.domElement.removeEventListener("wheel",ne),n.domElement.removeEventListener("pointermove",v),n.domElement.removeEventListener("pointerup",N),n._domElementKeyEvents!==null&&(n._domElementKeyEvents.removeEventListener("keydown",Ae),n._domElementKeyEvents=null)};const n=this,r={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let s=r.NONE;const a=1e-6,o=new wa,l=new wa;let c=1;const u=new w,h=new Ne,d=new Ne,m=new Ne,g=new Ne,_=new Ne,p=new Ne,f=new Ne,y=new Ne,x=new Ne,b=new w,L=new Ne;let P=!1;const R=[],K={};let S=!1;function A(T){return T!==null?2*Math.PI/60*n.autoRotateSpeed*T:2*Math.PI/60/60*n.autoRotateSpeed}function k(T){const ie=Math.abs(T*.01);return Math.pow(.95,n.zoomSpeed*ie)}function X(T){l.theta-=T}function oe(T){l.phi-=T}const D=function(){const T=new w;return function(Me,pe){T.setFromMatrixColumn(pe,0),T.multiplyScalar(-Me),u.add(T)}}(),z=function(){const T=new w;return function(Me,pe){n.screenSpacePanning===!0?T.setFromMatrixColumn(pe,1):(T.setFromMatrixColumn(pe,0),T.crossVectors(n.object.up,T)),T.multiplyScalar(Me),u.add(T)}}(),V=function(){const T=new w;return function(Me,pe){const ee=n.domElement;if(n.object.isPerspectiveCamera){const C=n.object.position;T.copy(C).sub(n.target);let re=T.length();re*=Math.tan(n.object.fov/2*Math.PI/180),D(2*Me*re/ee.clientHeight,n.object.matrix),z(2*pe*re/ee.clientHeight,n.object.matrix)}else n.object.isOrthographicCamera?(D(Me*(n.object.right-n.object.left)/n.object.zoom/ee.clientWidth,n.object.matrix),z(pe*(n.object.top-n.object.bottom)/n.object.zoom/ee.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}}();function j(T){n.object.isPerspectiveCamera||n.object.isOrthographicCamera?c/=T:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function Y(T){n.object.isPerspectiveCamera||n.object.isOrthographicCamera?c*=T:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function q(T,ie){if(!n.zoomToCursor)return;P=!0;const Me=n.domElement.getBoundingClientRect(),pe=T-Me.left,ee=ie-Me.top,C=Me.width,re=Me.height;L.x=pe/C*2-1,L.y=-(ee/re)*2+1,b.set(L.x,L.y,1).unproject(n.object).sub(n.object.position).normalize()}function $(T){return Math.max(n.minDistance,Math.min(n.maxDistance,T))}function se(T){h.set(T.clientX,T.clientY)}function ae(T){q(T.clientX,T.clientX),f.set(T.clientX,T.clientY)}function G(T){g.set(T.clientX,T.clientY)}function Z(T){d.set(T.clientX,T.clientY),m.subVectors(d,h).multiplyScalar(n.rotateSpeed);const ie=n.domElement;X(2*Math.PI*m.x/ie.clientHeight),oe(2*Math.PI*m.y/ie.clientHeight),h.copy(d),n.update()}function he(T){y.set(T.clientX,T.clientY),x.subVectors(y,f),x.y>0?j(k(x.y)):x.y<0&&Y(k(x.y)),f.copy(y),n.update()}function Se(T){_.set(T.clientX,T.clientY),p.subVectors(_,g).multiplyScalar(n.panSpeed),V(p.x,p.y),g.copy(_),n.update()}function ve(T){q(T.clientX,T.clientY),T.deltaY<0?Y(k(T.deltaY)):T.deltaY>0&&j(k(T.deltaY)),n.update()}function Fe(T){let ie=!1;switch(T.code){case n.keys.UP:T.ctrlKey||T.metaKey||T.shiftKey?oe(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):V(0,n.keyPanSpeed),ie=!0;break;case n.keys.BOTTOM:T.ctrlKey||T.metaKey||T.shiftKey?oe(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):V(0,-n.keyPanSpeed),ie=!0;break;case n.keys.LEFT:T.ctrlKey||T.metaKey||T.shiftKey?X(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):V(n.keyPanSpeed,0),ie=!0;break;case n.keys.RIGHT:T.ctrlKey||T.metaKey||T.shiftKey?X(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):V(-n.keyPanSpeed,0),ie=!0;break}ie&&(T.preventDefault(),n.update())}function Oe(T){if(R.length===1)h.set(T.pageX,T.pageY);else{const ie=de(T),Me=.5*(T.pageX+ie.x),pe=.5*(T.pageY+ie.y);h.set(Me,pe)}}function we(T){if(R.length===1)g.set(T.pageX,T.pageY);else{const ie=de(T),Me=.5*(T.pageX+ie.x),pe=.5*(T.pageY+ie.y);g.set(Me,pe)}}function Ze(T){const ie=de(T),Me=T.pageX-ie.x,pe=T.pageY-ie.y,ee=Math.sqrt(Me*Me+pe*pe);f.set(0,ee)}function F(T){n.enableZoom&&Ze(T),n.enablePan&&we(T)}function Ot(T){n.enableZoom&&Ze(T),n.enableRotate&&Oe(T)}function be(T){if(R.length==1)d.set(T.pageX,T.pageY);else{const Me=de(T),pe=.5*(T.pageX+Me.x),ee=.5*(T.pageY+Me.y);d.set(pe,ee)}m.subVectors(d,h).multiplyScalar(n.rotateSpeed);const ie=n.domElement;X(2*Math.PI*m.x/ie.clientHeight),oe(2*Math.PI*m.y/ie.clientHeight),h.copy(d)}function De(T){if(R.length===1)_.set(T.pageX,T.pageY);else{const ie=de(T),Me=.5*(T.pageX+ie.x),pe=.5*(T.pageY+ie.y);_.set(Me,pe)}p.subVectors(_,g).multiplyScalar(n.panSpeed),V(p.x,p.y),g.copy(_)}function ge(T){const ie=de(T),Me=T.pageX-ie.x,pe=T.pageY-ie.y,ee=Math.sqrt(Me*Me+pe*pe);y.set(0,ee),x.set(0,Math.pow(y.y/f.y,n.zoomSpeed)),j(x.y),f.copy(y);const C=(T.pageX+ie.x)*.5,re=(T.pageY+ie.y)*.5;q(C,re)}function ut(T){n.enableZoom&&ge(T),n.enablePan&&De(T)}function He(T){n.enableZoom&&ge(T),n.enableRotate&&be(T)}function E(T){n.enabled!==!1&&(R.length===0&&(n.domElement.setPointerCapture(T.pointerId),n.domElement.addEventListener("pointermove",v),n.domElement.addEventListener("pointerup",N)),Xe(T),T.pointerType==="touch"?Ge(T):te(T))}function v(T){n.enabled!==!1&&(T.pointerType==="touch"?J(T):Q(T))}function N(T){Ie(T),R.length===0&&(n.domElement.releasePointerCapture(T.pointerId),n.domElement.removeEventListener("pointermove",v),n.domElement.removeEventListener("pointerup",N)),n.dispatchEvent(Wc),s=r.NONE}function te(T){let ie;switch(T.button){case 0:ie=n.mouseButtons.LEFT;break;case 1:ie=n.mouseButtons.MIDDLE;break;case 2:ie=n.mouseButtons.RIGHT;break;default:ie=-1}switch(ie){case Xi.DOLLY:if(n.enableZoom===!1)return;ae(T),s=r.DOLLY;break;case Xi.ROTATE:if(T.ctrlKey||T.metaKey||T.shiftKey){if(n.enablePan===!1)return;G(T),s=r.PAN}else{if(n.enableRotate===!1)return;se(T),s=r.ROTATE}break;case Xi.PAN:if(T.ctrlKey||T.metaKey||T.shiftKey){if(n.enableRotate===!1)return;se(T),s=r.ROTATE}else{if(n.enablePan===!1)return;G(T),s=r.PAN}break;default:s=r.NONE}s!==r.NONE&&n.dispatchEvent(na)}function Q(T){switch(s){case r.ROTATE:if(n.enableRotate===!1)return;Z(T);break;case r.DOLLY:if(n.enableZoom===!1)return;he(T);break;case r.PAN:if(n.enablePan===!1)return;Se(T);break}}function ne(T){n.enabled===!1||n.enableZoom===!1||s!==r.NONE||(T.preventDefault(),n.dispatchEvent(na),ve(xe(T)),n.dispatchEvent(Wc))}function xe(T){const ie=T.deltaMode,Me={clientX:T.clientX,clientY:T.clientY,deltaY:T.deltaY};switch(ie){case 1:Me.deltaY*=16;break;case 2:Me.deltaY*=100;break}return T.ctrlKey&&!S&&(Me.deltaY*=10),Me}function ue(T){T.key==="Control"&&(S=!0,document.addEventListener("keyup",me,{passive:!0,capture:!0}))}function me(T){T.key==="Control"&&(S=!1,document.removeEventListener("keyup",me,{passive:!0,capture:!0}))}function Ae(T){n.enabled===!1||n.enablePan===!1||Fe(T)}function Ge(T){switch(ye(T),R.length){case 1:switch(n.touches.ONE){case Yi.ROTATE:if(n.enableRotate===!1)return;Oe(T),s=r.TOUCH_ROTATE;break;case Yi.PAN:if(n.enablePan===!1)return;we(T),s=r.TOUCH_PAN;break;default:s=r.NONE}break;case 2:switch(n.touches.TWO){case Yi.DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;F(T),s=r.TOUCH_DOLLY_PAN;break;case Yi.DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;Ot(T),s=r.TOUCH_DOLLY_ROTATE;break;default:s=r.NONE}break;default:s=r.NONE}s!==r.NONE&&n.dispatchEvent(na)}function J(T){switch(ye(T),s){case r.TOUCH_ROTATE:if(n.enableRotate===!1)return;be(T),n.update();break;case r.TOUCH_PAN:if(n.enablePan===!1)return;De(T),n.update();break;case r.TOUCH_DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;ut(T),n.update();break;case r.TOUCH_DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;He(T),n.update();break;default:s=r.NONE}}function it(T){n.enabled!==!1&&T.preventDefault()}function Xe(T){R.push(T.pointerId)}function Ie(T){delete K[T.pointerId];for(let ie=0;ie<R.length;ie++)if(R[ie]==T.pointerId){R.splice(ie,1);return}}function ye(T){let ie=K[T.pointerId];ie===void 0&&(ie=new Ne,K[T.pointerId]=ie),ie.set(T.pageX,T.pageY)}function de(T){const ie=T.pointerId===R[0]?R[1]:R[0];return K[ie]}n.domElement.addEventListener("contextmenu",it),n.domElement.addEventListener("pointerdown",E),n.domElement.addEventListener("pointercancel",N),n.domElement.addEventListener("wheel",ne,{passive:!1}),document.addEventListener("keydown",ue,{passive:!0,capture:!0}),this.update()}}class tx extends $a{constructor(e=null){super();const t=new Wi;t.deleteAttribute("uv");const n=new $s({side:Qt}),r=new $s;let s=5;e!==null&&e._useLegacyLights===!1&&(s=900);const a=new q_(16777215,s,28,2);a.position.set(.418,16.199,.3),this.add(a);const o=new ct(t,n);o.position.set(-.757,13.219,.717),o.scale.set(31.713,28.305,28.591),this.add(o);const l=new ct(t,r);l.position.set(-10.906,2.009,1.846),l.rotation.set(0,-.195,0),l.scale.set(2.328,7.905,4.651),this.add(l);const c=new ct(t,r);c.position.set(-5.607,-.754,-.758),c.rotation.set(0,.994,0),c.scale.set(1.97,1.534,3.955),this.add(c);const u=new ct(t,r);u.position.set(6.167,.857,7.803),u.rotation.set(0,.561,0),u.scale.set(3.927,6.285,3.687),this.add(u);const h=new ct(t,r);h.position.set(-2.017,.018,6.124),h.rotation.set(0,.333,0),h.scale.set(2.002,4.566,2.064),this.add(h);const d=new ct(t,r);d.position.set(2.291,-.756,-2.621),d.rotation.set(0,-.286,0),d.scale.set(1.546,1.552,1.496),this.add(d);const m=new ct(t,r);m.position.set(-2.193,-.369,-5.547),m.rotation.set(0,.516,0),m.scale.set(3.875,3.487,2.986),this.add(m);const g=new ct(t,ur(50));g.position.set(-16.116,14.37,8.208),g.scale.set(.1,2.428,2.739),this.add(g);const _=new ct(t,ur(50));_.position.set(-16.109,18.021,-8.207),_.scale.set(.1,2.425,2.751),this.add(_);const p=new ct(t,ur(17));p.position.set(14.904,12.198,-1.832),p.scale.set(.15,4.265,6.331),this.add(p);const f=new ct(t,ur(43));f.position.set(-.462,8.89,14.52),f.scale.set(4.38,5.441,.088),this.add(f);const y=new ct(t,ur(20));y.position.set(3.235,11.486,-12.541),y.scale.set(2.5,2,.1),this.add(y);const x=new ct(t,ur(100));x.position.set(0,20,0),x.scale.set(1,.1,1),this.add(x)}dispose(){const e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(const t of e)t.dispose()}}function ur(i){const e=new Qr;return e.color.setScalar(i),e}const Gt=8,_n=["#ff6b6b","#4caf50","#2196f3","#f0c674","#9b59b6","#1abc9c","#e67e22","#ecf0f1"],nx=["wireframe","transparent","solid"];class eh{constructor(e){lt(this,"N");lt(this,"R");this.N=e,this.R=new Float32Array(e*e);for(let t=0;t<e;t++)this.R[t*e+t]=1}reset(){this.R.fill(0);for(let e=0;e<this.N;e++)this.R[e*this.N+e]=1}get matrix(){return this.R}applyGivensLeft(e,t,n){if(e===t)return;const r=this.N,s=Math.cos(n),a=Math.sin(n);for(let o=0;o<r;o++){const l=this.R[e*r+o],c=this.R[t*r+o];this.R[e*r+o]=s*l-a*c,this.R[t*r+o]=a*l+s*c}}}function Ks(i){const e=new Float32Array(3*i);return e[0]=1,i>1&&(e[i+1]=1),i>2&&(e[2*i+2]=1),e}class th{constructor(e,t,n=Ks(e)){lt(this,"N");lt(this,"P");lt(this,"R");lt(this,"tmp");this.N=e,this.R=t,this.P=n}resizeBuffers(e){(!this.tmp||this.tmp.length!==this.N*e)&&(this.tmp=new Float32Array(this.N*e))}setCanonicalP(){this.P=Ks(this.N)}setCustomP(e){if(e.length!==3*this.N)throw new Error("Projection matrix must be 3xN");this.P=e}project(e,t,n){this.resizeBuffers(t);const{N:r,tmp:s,R:a,P:o}=this;for(let l=0;l<t;l++)for(let c=0;c<r;c++){let u=0;for(let h=0;h<r;h++)u+=a[c*r+h]*e[h*t+l];s[c*t+l]=u}for(let l=0;l<t;l++)for(let c=0;c<3;c++){let u=0;for(let h=0;h<r;h++)u+=o[c*r+h]*s[h*t+l];n[c*t+l]=u}}}function ix(i){const e=1<<i,t=new Float32Array(i*e);for(let r=0;r<e;r++)for(let s=0;s<i;s++)t[s*e+r]=r>>s&1?.5:-.5;const n=[];for(let r=0;r<e;r++)for(let s=0;s<i;s++){const a=r^1<<s;a>r&&n.push(r,a)}return{verts:t,edges:new Uint32Array(n),V:e}}function rx(i){const e=2*i,t=new Float32Array(i*e);for(let r=0;r<i;r++){const s=2*r,a=s+1;for(let o=0;o<i;o++){const l=o===r?.5:0;t[o*e+s]=l,t[o*e+a]=-l}}const n=[];for(let r=0;r<e;r++)for(let s=r+1;s<e;s++)Math.floor(r/2)!==Math.floor(s/2)&&n.push(r,s);return{verts:t,edges:new Uint32Array(n),V:e}}function nh(i){const e=i+1,t=new Float32Array(i*e);for(let o=0;o<i;o++)t[o*e+o+1]=1;const n=new Float32Array(i);for(let o=0;o<i;o++){let l=0;for(let c=0;c<e;c++)l+=t[o*e+c];n[o]=l/e}for(let o=0;o<i;o++){const l=n[o];for(let c=0;c<e;c++)t[o*e+c]-=l}let r=0;for(let o=0;o<t.length;o++)r=Math.max(r,Math.abs(t[o]));const s=r>0?.5/r:1;for(let o=0;o<t.length;o++)t[o]*=s;const a=[];for(let o=0;o<e;o++)for(let l=o+1;l<e;l++)a.push(o,l);return{verts:t,edges:new Uint32Array(a),V:e}}function sx(i){const e=Math.max(2,i-1),t=nh(e),n=t.V,r=n*2,s=new Float32Array(i*r),a=Math.min(i-1,e);for(let l=0;l<n;l++){for(let c=0;c<e;c++){const u=t.verts[c*n+l];s[c*r+l]=u,s[c*r+l+n]=u}s[a*r+l]=-.4,s[a*r+l+n]=.4}const o=[];for(let l=0;l<t.edges.length;l+=2){const c=t.edges[l],u=t.edges[l+1];o.push(c,u,c+n,u+n)}for(let l=0;l<n;l++)o.push(l,l+n);return{verts:s,edges:new Uint32Array(o),V:r}}function ih(i,e){switch(i){case"hypercube":return ix(e);case"cross":return rx(e);case"simplex":return nh(e);case"simplexPrism":return sx(e)}}const ia=/^d(\d+)$/i;function hr(i){return typeof i=="object"&&i!==null&&!Array.isArray(i)}function ox(i){const e=Object.keys(i);return e.every(t=>ia.test(t))?e.sort((t,n)=>Number(t.match(ia)[1])-Number(n.match(ia)[1])):e.every(t=>Number.isInteger(Number(t)))?e.sort((t,n)=>Number(t)-Number(n)):e}function Yc(i,e,t){return!Number.isInteger(i)||!Number.isInteger(e)||i<0||e<0||i>=t||e>=t||i===e?null:i<e?`${i}:${e}`:`${e}:${i}`}function ax(i){const e=[];for(const t of i){const[n,r]=t.split(":").map(Number);e.push(n,r)}return new Uint32Array(e)}function lx(i){const e=JSON.parse(i),t=Array.isArray(e)?e:hr(e)&&Array.isArray(e.points)?e.points:null;if(!(t!=null&&t.length))throw new Error("JSON must include a non-empty points array");const n=t[0],r=Array.isArray(n),s=Array.isArray(n)?null:hr(n)?ox(n):null;if(!r&&!s)throw new Error("Points must be arrays or objects");const a=r?n.length:s.length;if(a<3||a>32)throw new Error("JSON must have between 3 and 32 dimensions");const o=[];for(let h=0;h<t.length;h++){const d=t[h],m=r?Array.isArray(d)?d:null:hr(d)?s.map(_=>d[_]):null;if(!m||m.length!==a)throw new Error(`Point ${h+1} has inconsistent dimensionality`);const g=m.map(Number);for(let _=0;_<a;_++)if(!Number.isFinite(g[_]))throw new Error(`Non-numeric value at point ${h+1}, dimension ${_+1}`);o.push(g)}const l=o.length,c=new Float32Array(a*l);for(let h=0;h<l;h++)for(let d=0;d<a;d++)c[d*l+h]=o[h][d];const u=new Set;if(hr(e)&&Array.isArray(e.edges))for(const h of e.edges){if(!Array.isArray(h)||h.length<2)continue;const d=Yc(Number(h[0]),Number(h[1]),l);d&&u.add(d)}if(u.size===0&&hr(e)&&hr(e.adjacency)){for(const[h,d]of Object.entries(e.adjacency))if(Array.isArray(d))for(const m of d){const g=Yc(Number(h),Number(m),l);g&&u.add(g)}}return{N:a,X:c,edges:ax(u)}}function cx(i,e,t,n){const r=[];for(let o=0;o<e;o++){const l={};for(let c=0;c<t;c++)l[`d${c}`]=i[c*e+o];r.push(l)}const s=[];if(n&&n.length>1)for(let o=0;o<n.length;o+=2){const l=n[o],c=n[o+1];l!==c&&l>=0&&c>=0&&l<e&&c<e&&s.push([l,c])}const a={};for(const[o,l]of s)(a[o]??(a[o]=[])).push(l),(a[l]??(a[l]=[])).push(o);return JSON.stringify({points:r,edges:s,adjacency:a},null,2)}const zs=0,ux=1,hx=new w,qc=new Z_,ra=new An,jc=new w,Ds=new gn;class dx{constructor(){this.tolerance=-1,this.faces=[],this.newFaces=[],this.assigned=new $c,this.unassigned=new $c,this.vertices=[]}setFromPoints(e){if(e.length>=4){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.vertices.push(new fx(e[t]));this.compute()}return this}setFromObject(e){const t=[];return e.updateMatrixWorld(!0),e.traverse(function(n){const r=n.geometry;if(r!==void 0){const s=r.attributes.position;if(s!==void 0)for(let a=0,o=s.count;a<o;a++){const l=new w;l.fromBufferAttribute(s,a).applyMatrix4(n.matrixWorld),t.push(l)}}}),this.setFromPoints(t)}containsPoint(e){const t=this.faces;for(let n=0,r=t.length;n<r;n++)if(t[n].distanceToPoint(e)>this.tolerance)return!1;return!0}intersectRay(e,t){const n=this.faces;let r=-1/0,s=1/0;for(let a=0,o=n.length;a<o;a++){const l=n[a],c=l.distanceToPoint(e.origin),u=l.normal.dot(e.direction);if(c>0&&u>=0)return null;const h=u!==0?-c/u:0;if(!(h<=0)&&(u>0?s=Math.min(h,s):r=Math.max(h,r),r>s))return null}return r!==-1/0?e.at(r,t):e.at(s,t),t}intersectsRay(e){return this.intersectRay(e,hx)!==null}makeEmpty(){return this.faces=[],this.vertices=[],this}addVertexToFace(e,t){return e.face=t,t.outside===null?this.assigned.append(e):this.assigned.insertBefore(t.outside,e),t.outside=e,this}removeVertexFromFace(e,t){return e===t.outside&&(e.next!==null&&e.next.face===t?t.outside=e.next:t.outside=null),this.assigned.remove(e),this}removeAllVerticesFromFace(e){if(e.outside!==null){const t=e.outside;let n=e.outside;for(;n.next!==null&&n.next.face===e;)n=n.next;return this.assigned.removeSubList(t,n),t.prev=n.next=null,e.outside=null,t}}deleteFaceVertices(e,t){const n=this.removeAllVerticesFromFace(e);if(n!==void 0)if(t===void 0)this.unassigned.appendChain(n);else{let r=n;do{const s=r.next;t.distanceToPoint(r.point)>this.tolerance?this.addVertexToFace(r,t):this.unassigned.append(r),r=s}while(r!==null)}return this}resolveUnassignedPoints(e){if(this.unassigned.isEmpty()===!1){let t=this.unassigned.first();do{const n=t.next;let r=this.tolerance,s=null;for(let a=0;a<e.length;a++){const o=e[a];if(o.mark===zs){const l=o.distanceToPoint(t.point);if(l>r&&(r=l,s=o),r>1e3*this.tolerance)break}}s!==null&&this.addVertexToFace(t,s),t=n}while(t!==null)}return this}computeExtremes(){const e=new w,t=new w,n=[],r=[];for(let s=0;s<3;s++)n[s]=r[s]=this.vertices[0];e.copy(this.vertices[0].point),t.copy(this.vertices[0].point);for(let s=0,a=this.vertices.length;s<a;s++){const o=this.vertices[s],l=o.point;for(let c=0;c<3;c++)l.getComponent(c)<e.getComponent(c)&&(e.setComponent(c,l.getComponent(c)),n[c]=o);for(let c=0;c<3;c++)l.getComponent(c)>t.getComponent(c)&&(t.setComponent(c,l.getComponent(c)),r[c]=o)}return this.tolerance=3*Number.EPSILON*(Math.max(Math.abs(e.x),Math.abs(t.x))+Math.max(Math.abs(e.y),Math.abs(t.y))+Math.max(Math.abs(e.z),Math.abs(t.z))),{min:n,max:r}}computeInitialHull(){const e=this.vertices,t=this.computeExtremes(),n=t.min,r=t.max;let s=0,a=0;for(let d=0;d<3;d++){const m=r[d].point.getComponent(d)-n[d].point.getComponent(d);m>s&&(s=m,a=d)}const o=n[a],l=r[a];let c,u;s=0,qc.set(o.point,l.point);for(let d=0,m=this.vertices.length;d<m;d++){const g=e[d];if(g!==o&&g!==l){qc.closestPointToPoint(g.point,!0,jc);const _=jc.distanceToSquared(g.point);_>s&&(s=_,c=g)}}s=-1,ra.setFromCoplanarPoints(o.point,l.point,c.point);for(let d=0,m=this.vertices.length;d<m;d++){const g=e[d];if(g!==o&&g!==l&&g!==c){const _=Math.abs(ra.distanceToPoint(g.point));_>s&&(s=_,u=g)}}const h=[];if(ra.distanceToPoint(u.point)<0){h.push(Tn.create(o,l,c),Tn.create(u,l,o),Tn.create(u,c,l),Tn.create(u,o,c));for(let d=0;d<3;d++){const m=(d+1)%3;h[d+1].getEdge(2).setTwin(h[0].getEdge(m)),h[d+1].getEdge(1).setTwin(h[m+1].getEdge(0))}}else{h.push(Tn.create(o,c,l),Tn.create(u,o,l),Tn.create(u,l,c),Tn.create(u,c,o));for(let d=0;d<3;d++){const m=(d+1)%3;h[d+1].getEdge(2).setTwin(h[0].getEdge((3-d)%3)),h[d+1].getEdge(0).setTwin(h[m+1].getEdge(1))}}for(let d=0;d<4;d++)this.faces.push(h[d]);for(let d=0,m=e.length;d<m;d++){const g=e[d];if(g!==o&&g!==l&&g!==c&&g!==u){s=this.tolerance;let _=null;for(let p=0;p<4;p++){const f=this.faces[p].distanceToPoint(g.point);f>s&&(s=f,_=this.faces[p])}_!==null&&this.addVertexToFace(g,_)}}return this}reindexFaces(){const e=[];for(let t=0;t<this.faces.length;t++){const n=this.faces[t];n.mark===zs&&e.push(n)}return this.faces=e,this}nextVertexToAdd(){if(this.assigned.isEmpty()===!1){let e,t=0;const n=this.assigned.first().face;let r=n.outside;do{const s=n.distanceToPoint(r.point);s>t&&(t=s,e=r),r=r.next}while(r!==null&&r.face===n);return e}}computeHorizon(e,t,n,r){this.deleteFaceVertices(n),n.mark=ux;let s;t===null?s=t=n.getEdge(0):s=t.next;do{const a=s.twin,o=a.face;o.mark===zs&&(o.distanceToPoint(e)>this.tolerance?this.computeHorizon(e,a,o,r):r.push(s)),s=s.next}while(s!==t);return this}addAdjoiningFace(e,t){const n=Tn.create(e,t.tail(),t.head());return this.faces.push(n),n.getEdge(-1).setTwin(t.twin),n.getEdge(0)}addNewFaces(e,t){this.newFaces=[];let n=null,r=null;for(let s=0;s<t.length;s++){const a=t[s],o=this.addAdjoiningFace(e,a);n===null?n=o:o.next.setTwin(r),this.newFaces.push(o.face),r=o}return n.next.setTwin(r),this}addVertexToHull(e){const t=[];return this.unassigned.clear(),this.removeVertexFromFace(e,e.face),this.computeHorizon(e.point,null,e.face,t),this.addNewFaces(e,t),this.resolveUnassignedPoints(this.newFaces),this}cleanup(){return this.assigned.clear(),this.unassigned.clear(),this.newFaces=[],this}compute(){let e;for(this.computeInitialHull();(e=this.nextVertexToAdd())!==void 0;)this.addVertexToHull(e);return this.reindexFaces(),this.cleanup(),this}}class Tn{constructor(){this.normal=new w,this.midpoint=new w,this.area=0,this.constant=0,this.outside=null,this.mark=zs,this.edge=null}static create(e,t,n){const r=new Tn,s=new sa(e,r),a=new sa(t,r),o=new sa(n,r);return s.next=o.prev=a,a.next=s.prev=o,o.next=a.prev=s,r.edge=s,r.compute()}getEdge(e){let t=this.edge;for(;e>0;)t=t.next,e--;for(;e<0;)t=t.prev,e++;return t}compute(){const e=this.edge.tail(),t=this.edge.head(),n=this.edge.next.head();return Ds.set(e.point,t.point,n.point),Ds.getNormal(this.normal),Ds.getMidpoint(this.midpoint),this.area=Ds.getArea(),this.constant=this.normal.dot(this.midpoint),this}distanceToPoint(e){return this.normal.dot(e)-this.constant}}class sa{constructor(e,t){this.vertex=e,this.prev=null,this.next=null,this.twin=null,this.face=t}head(){return this.vertex}tail(){return this.prev?this.prev.vertex:null}length(){const e=this.head(),t=this.tail();return t!==null?t.point.distanceTo(e.point):-1}lengthSquared(){const e=this.head(),t=this.tail();return t!==null?t.point.distanceToSquared(e.point):-1}setTwin(e){return this.twin=e,e.twin=this,this}}class fx{constructor(e){this.point=e,this.prev=null,this.next=null,this.face=null}}class $c{constructor(){this.head=null,this.tail=null}first(){return this.head}last(){return this.tail}clear(){return this.head=this.tail=null,this}insertBefore(e,t){return t.prev=e.prev,t.next=e,t.prev===null?this.head=t:t.prev.next=t,e.prev=t,this}insertAfter(e,t){return t.prev=e,t.next=e.next,t.next===null?this.tail=t:t.next.prev=t,e.next=t,this}append(e){return this.head===null?this.head=e:this.tail.next=e,e.prev=this.tail,e.next=null,this.tail=e,this}appendChain(e){for(this.head===null?this.head=e:this.tail.next=e,e.prev=this.tail;e.next!==null;)e=e.next;return this.tail=e,this}remove(e){return e.prev===null?this.head=e.next:e.prev.next=e.next,e.next===null?this.tail=e.prev:e.next.prev=e.prev,this}removeSubList(e,t){return e.prev===null?this.head=t.next:e.prev.next=t.next,t.next===null?this.tail=e.prev:t.next.prev=e.prev,this}isEmpty(){return this.head===null}}const px={color:12568533,metalness:1,roughness:.05,alpha:1},oa=i=>Math.max(0,Math.min(1,i));class po{constructor(e){lt(this,"scene");lt(this,"group");lt(this,"geometry");lt(this,"line");lt(this,"mesh");lt(this,"positions");lt(this,"M");lt(this,"allEdges");lt(this,"visibleEdges");lt(this,"offset",new w);lt(this,"lineMaterial");lt(this,"solidMaterial");lt(this,"mode","wireframe");lt(this,"hullNeedsUpdate",!1);lt(this,"points",[]);lt(this,"visibleVertexMask");lt(this,"transform",new at);lt(this,"tmp",new w);lt(this,"surface",{...px});this.scene=e,this.group=new pr,this.scene.add(this.group),this.lineMaterial=new Bi({color:15069183,transparent:!0,opacity:.95}),this.solidMaterial=new $s({color:this.surface.color,metalness:this.surface.metalness,roughness:this.surface.roughness,transparent:!1,opacity:this.surface.alpha,envMapIntensity:1.8,side:Rn,depthWrite:!0,vertexColors:!1})}build(e,t){this.dispose(),this.M=e,this.allEdges=t,this.visibleEdges=t,this.geometry=new jt,this.positions=new Float32Array(3*e),this.geometry.setAttribute("position",new hn(this.positions,3)),this.setIndexAttribute(this.visibleEdges),this.line=new ho(this.geometry,this.lineMaterial),this.line.visible=this.mode==="wireframe",this.group.add(this.line),this.points=Array.from({length:e},(n,r)=>{const s=new w;return s.__vertexId=r,s}),this.mesh=new ct(new jt,this.solidMaterial),this.mesh.visible=this.mode==="solid",this.group.add(this.mesh),this.hullNeedsUpdate=!0,this.visibleVertexMask=void 0}setTransform(e,t,n){const r=new On().setFromEuler(t);this.transform.compose(e,r,n)}writeInterleavedFrom(e){const t=this.M,{positions:n}=this,r=e.subarray(0,t),s=e.subarray(t,2*t),a=e.subarray(2*t,3*t);let o=0;for(let l=0;l<t;l++)this.tmp.set(r[l],s[l],a[l]).applyMatrix4(this.transform),n[o++]=this.tmp.x,n[o++]=this.tmp.y,n[o++]=this.tmp.z,this.points[l].copy(this.tmp);this.geometry.getAttribute("position").needsUpdate=!0,this.geometry.computeBoundingSphere(),this.geometry.computeBoundingBox(),this.mode!=="wireframe"&&(this.hullNeedsUpdate=!0,this.updateHullGeometry())}setMode(e){this.mode=e,this.line&&(this.line.visible=e==="wireframe"||e==="transparent",this.line.material.depthTest=e!=="transparent",this.line.renderOrder=e==="transparent"?5:0),this.mesh&&(this.mesh.material=this.solidMaterial,this.mesh.visible=e!=="wireframe"&&this.mesh.geometry.attributes.position!==void 0,this.applySurfaceMaterial()),this.hullNeedsUpdate=e!=="wireframe",e!=="wireframe"&&this.updateHullGeometry()}setSurface(e){this.surface={color:Math.max(0,Math.min(16777215,e.color>>>0)),metalness:oa(e.metalness),roughness:oa(e.roughness),alpha:oa(e.alpha)},this.applySurfaceMaterial()}getSurface(){return{...this.surface}}filterEdgesByDimRange(e,t,n,r,s,a){if(r<0||r>=t){this.visibleEdges=this.allEdges,this.visibleVertexMask=void 0,this.setIndexAttribute(this.allEdges),this.refreshSurface();return}const o=new Uint8Array(n),l=r*n;for(let u=0;u<n;u++){const h=e[l+u];o[u]=h>=s&&h<=a?1:0}const c=[];for(let u=0;u<this.allEdges.length;u+=2){const h=this.allEdges[u],d=this.allEdges[u+1];o[h]&&o[d]&&c.push(h,d)}this.visibleEdges=new Uint32Array(c.length?c:[0,0]),this.visibleVertexMask=o,this.setIndexAttribute(this.visibleEdges),this.geometry.index.needsUpdate=!0,this.refreshSurface()}refreshSurface(){this.mode==="wireframe"||!this.mesh||(this.hullNeedsUpdate=!0,this.updateHullGeometry())}dispose(){this.line&&(this.group.remove(this.line),this.line.geometry.dispose()),this.mesh&&(this.group.remove(this.mesh),this.mesh.geometry.dispose(),this.mesh=void 0),this.geometry=void 0}setIndexAttribute(e){this.geometry.setIndex(new hn(e,1))}applySurfaceMaterial(){const e=this.solidMaterial;e.color.setHex(this.surface.color),e.metalness=this.surface.metalness,e.roughness=this.surface.roughness,this.mode==="transparent"?(e.transparent=!0,e.opacity=.5,e.depthWrite=!1):(e.transparent=this.surface.alpha<.999,e.opacity=this.surface.alpha,e.depthWrite=!e.transparent),e.needsUpdate=!0}updateHullGeometry(){if(!this.mesh||!this.hullNeedsUpdate||this.mode==="wireframe")return;const e=this.visibleVertexMask?this.points.reduce((n,r,s)=>(this.visibleVertexMask[s]===1&&n.push(s),n),[]):this.points.map((n,r)=>r);if(e.length<4){this.mesh.visible=!1,this.hullNeedsUpdate=!1;return}const t=this.buildColoredHull(e.map(n=>this.points[n]));t.computeVertexNormals(),t.computeBoundingSphere(),this.mesh.geometry.dispose(),this.mesh.geometry=t,this.mesh.visible=!0,this.hullNeedsUpdate=!1}buildColoredHull(e){const t=new dx().setFromPoints(e),n=[],r=[];for(const a of t.faces){let o=a.edge;do{const l=o.head().point;n.push(l.x,l.y,l.z),r.push(a.normal.x,a.normal.y,a.normal.z),o=o.next}while(o!==a.edge)}const s=new jt;return s.setAttribute("position",new Ht(n,3)),s.setAttribute("normal",new Ht(r,3)),s}}const mx=document.getElementById("app"),mi=document.getElementById("file-input"),Xn=document.getElementById("tooltip"),et=document.getElementById("context-menu"),Kc=document.getElementById("view-toggle"),Xt=document.getElementById("axis-gizmo"),ot=document.getElementById("w-axis-gizmo"),bn=document.getElementById("w-axis-gizmo-line"),Kt=document.getElementById("w-axis-gizmo-neg"),Bt=document.getElementById("w-axis-gizmo-pos"),aa=document.getElementById("w-axis-gizmo-label"),si=document.getElementById("auto-rotate-toggle"),la=document.getElementById("import-json-button"),ca=document.getElementById("export-json-button"),xr=document.getElementById("edit-mode-toggle"),ua=document.getElementById("dimension-control"),Zc=document.getElementById("dimension-value"),kr=document.getElementById("dimension-down"),Wr=document.getElementById("dimension-up"),Hs=document.getElementById("texture-panel"),Xr=document.getElementById("texture-preview"),Zt=document.getElementById("texture-base-color"),Zs=document.getElementById("texture-base-color-value"),tn=document.getElementById("texture-metallic"),Js=document.getElementById("texture-metallic-value"),nn=document.getElementById("texture-roughness"),Qs=document.getElementById("texture-roughness-value"),rn=document.getElementById("texture-alpha"),eo=document.getElementById("texture-alpha-value"),nt=new ja({antialias:!0});nt.setSize(window.innerWidth,window.innerHeight);mx.appendChild(nt.domElement);nt.toneMapping=Mu;nt.toneMappingExposure=1.1;nt.useLegacyLights=!1;nt.outputColorSpace=Lt;nt.setPixelRatio(Math.min(window.devicePixelRatio,2));const Le=new $a,es=new je(1053722),mo=new je(1315860);Le.background=es.clone();nt.setClearColor(Le.background);const rh=new ya(nt),gx=rh.fromScene(new tx,.04).texture;rh.dispose();Le.environment=gx;const rt=new sn(50,window.innerWidth/window.innerHeight,.01,100);rt.position.set(2.6,1.8,2.6);const Mt=new ex(rt,nt.domElement);Mt.enableDamping=!0;const sh=new w(0,1,0),Ra=[],Is=43,Jc=28,ni=43,ii=28;let to=-Math.PI/4;const ht={active:!1,moved:!1,pointerId:-1,lastX:0,lastY:0,snapVector:null},pt={active:!1,moved:!1,pointerId:-1,lastAngle:0,planeAxis:-1,depthAxis:-1};function Qc(i){let e=i;for(;e>Math.PI;)e-=Math.PI*2;for(;e<-Math.PI;)e+=Math.PI*2;return e}function oh(i){if(!ot)return null;const e=ot.getBoundingClientRect(),t=e.left+e.width*.5,n=e.top+e.height*.5,r=i.clientX-t,s=i.clientY-n;return r*r+s*s<16?null:Math.atan2(s,r)}function ah(){const i=zt();if(i<4)return null;const e=Pt[(vt+3)%i];if(e==null)return null;const t=ph(-1,e);return t<0||t===e?null:{planeAxis:t,wDim:e}}function _x(i){if(!ot||ot.classList.contains("disabled"))return;const e=oh(i),t=ah();if(!(e==null||!t)){pt.active=!0,pt.moved=!1,pt.pointerId=i.pointerId,pt.lastAngle=e,pt.planeAxis=t.planeAxis,pt.depthAxis=t.wDim;try{ot.setPointerCapture(i.pointerId)}catch{}ot.classList.add("dragging")}}function eu(i){ot&&i.pointerId===pt.pointerId&&(pt.active=!1,pt.moved=!1,pt.pointerId=-1,pt.lastAngle=0,pt.planeAxis=-1,pt.depthAxis=-1,ot.hasPointerCapture(i.pointerId)&&ot.releasePointerCapture(i.pointerId),ot.classList.remove("dragging"))}function tu(i){const e=Mt.target.clone(),t=Math.max(rt.position.distanceTo(e),.8),n=i.clone().normalize();rt.up.copy(sh),rt.position.copy(e).addScaledVector(n,t),rt.lookAt(e),Mt.update(),go()}function xx(){if(!Xt)return;const i=document.createElementNS("http://www.w3.org/2000/svg","svg");Xt.appendChild(i);const e=[{slot:0,vector:new w(1,0,0)},{slot:1,vector:new w(0,1,0)},{slot:2,vector:new w(0,0,1)}];for(const n of e)for(const r of[1,-1]){const s=n.vector.clone().multiplyScalar(r),a=document.createElementNS("http://www.w3.org/2000/svg","line");i.appendChild(a);const o=document.createElement("button");o.type="button",o.classList.toggle("negative",r<0),o.addEventListener("pointerdown",l=>{l.preventDefault(),l.stopPropagation(),nu(l,s)}),o.addEventListener("click",l=>{l.preventDefault(),l.stopPropagation(),ht.moved||tu(s)}),Xt.appendChild(o),Ra.push({slot:n.slot,vector:s,button:o,line:a})}Xt.addEventListener("pointerdown",n=>{n.preventDefault(),n.stopPropagation(),nu(n)}),Xt.addEventListener("pointermove",n=>{if(!ht.active||n.pointerId!==ht.pointerId)return;n.preventDefault();const r=n.clientX-ht.lastX,s=n.clientY-ht.lastY;ht.lastX=n.clientX,ht.lastY=n.clientY,Math.abs(r)+Math.abs(s)>2&&(ht.moved=!0),vx(r,s)}),Xt.addEventListener("pointerup",n=>{n.pointerId===ht.pointerId&&(!ht.moved&&ht.snapVector&&tu(ht.snapVector),ht.active=!1,ht.pointerId=-1,ht.snapVector=null,Xt.hasPointerCapture(n.pointerId)&&Xt.releasePointerCapture(n.pointerId),Xt.classList.remove("dragging"))}),Xt.addEventListener("pointercancel",n=>{n.pointerId===ht.pointerId&&(ht.active=!1,ht.pointerId=-1,ht.snapVector=null,Xt.hasPointerCapture(n.pointerId)&&Xt.releasePointerCapture(n.pointerId),Xt.classList.remove("dragging"))});const t=n=>{n.preventDefault(),n.stopPropagation(),_x(n)};ot==null||ot.addEventListener("pointerdown",t),Kt==null||Kt.addEventListener("pointerdown",t),Bt==null||Bt.addEventListener("pointerdown",t),ot==null||ot.addEventListener("pointermove",n=>{if(!pt.active||n.pointerId!==pt.pointerId)return;n.preventDefault();const r=oh(n);if(r==null)return;const s=Qc(r-pt.lastAngle);pt.lastAngle=r,!(Math.abs(s)<1e-4)&&(pt.moved=!0,pt.planeAxis>=0&&pt.depthAxis>=0&&pt.planeAxis!==pt.depthAxis&&(_i.applyGivensLeft(pt.planeAxis,pt.depthAxis,s),to=Qc(to+s)))}),ot==null||ot.addEventListener("pointerup",eu),ot==null||ot.addEventListener("pointercancel",eu),go()}function nu(i,e){if(Xt){ht.active=!0,ht.moved=!1,ht.pointerId=i.pointerId,ht.lastX=i.clientX,ht.lastY=i.clientY,ht.snapVector=(e==null?void 0:e.clone())??null;try{Xt.setPointerCapture(i.pointerId)}catch{}Xt.classList.add("dragging")}}function vx(i,e){rt.up.copy(sh);const t=rt.position.clone().sub(Mt.target),n=new wa().setFromVector3(t),r=.008,s=.01,a=Math.PI-.01;n.theta-=i*r,n.phi=Math.max(s,Math.min(a,n.phi-e*r)),t.setFromSpherical(n),rt.position.copy(Mt.target).add(t),rt.lookAt(Mt.target),Mt.update(),go()}function go(){if(!Ra.length)return;const i=rt.quaternion.clone().invert(),e=[W.axesX,W.axesY,W.axesZ];for(const t of Ra){const n=e[t.slot]??t.slot,r=Yn(n),s=_n[n%_n.length],a=t.vector.getComponent(t.slot)>0,o=`${a?"+":"-"}${r}`;t.button.textContent=a?r:"",t.button.title=`View ${o}`,t.button.setAttribute("aria-label",t.button.title),t.button.style.setProperty("--axis-color",s),t.line.style.stroke=s;const l=t.vector.clone().applyQuaternion(i),c=Is+l.x*Jc,u=Is-l.y*Jc,h=l.z>0;t.button.style.left=`${c}px`,t.button.style.top=`${u}px`,t.button.style.zIndex=`${Math.round((1-l.z)*100)}`,t.button.classList.toggle("back",h),t.line.setAttribute("x1",`${Is}`),t.line.setAttribute("y1",`${Is}`),t.line.setAttribute("x2",`${c}`),t.line.setAttribute("y2",`${u}`),t.line.style.opacity=h?"0.2":"0.64"}Mx()}function Mx(){if(!ot||!bn||!aa||!Kt||!Bt)return;const i=ah(),e=!!i;if(ot.classList.toggle("disabled",!e),ot.title=e?`Rotate global ${Yn(i.wDim)} axis (${Yn(i.planeAxis)}-${Yn(i.wDim)} plane)`:"W axis available in 4D+",ot.setAttribute("aria-label",ot.title),Bt.disabled=!e,Kt.disabled=!e,!i){const c=ni-ii*.7,u=ni+ii*.7,h=ni+ii*.7,d=ni-ii*.7;aa.textContent="W",bn.setAttribute("x1",`${c}`),bn.setAttribute("y1",`${u}`),bn.setAttribute("x2",`${h}`),bn.setAttribute("y2",`${d}`),bn.style.opacity="0.35",Kt.style.left=`${c}px`,Kt.style.top=`${u}px`,Bt.style.left=`${h}px`,Bt.style.top=`${d}px`,Bt.textContent="W",Bt.classList.add("back"),Kt.classList.add("back");return}const t=Yn(i.wDim);aa.textContent=t,Bt.textContent=t,Bt.title=`Rotate ${Yn(i.planeAxis)}-${t}`,Bt.setAttribute("aria-label",Bt.title),Kt.title=`Rotate ${Yn(i.planeAxis)}-${t}`,Kt.setAttribute("aria-label",Kt.title);const n=Math.cos(to),r=Math.sin(to),s=ni-n*ii,a=ni-r*ii,o=ni+n*ii,l=ni+r*ii;bn.setAttribute("x1",`${s}`),bn.setAttribute("y1",`${a}`),bn.setAttribute("x2",`${o}`),bn.setAttribute("y2",`${l}`),bn.style.opacity="0.9",Kt.style.left=`${s}px`,Kt.style.top=`${a}px`,Bt.style.left=`${o}px`,Bt.style.top=`${l}px`,Bt.classList.remove("back"),Kt.classList.remove("back"),Bt.style.zIndex="2",Kt.style.zIndex="1"}const li=new K_,ci=new Ne,iu=new An,ru=new w,no=new Ju(16777215,1);no.position.set(2,3,4);const lh=new Qu(16777215,.3),Gs=new Ku(8956671,592658,.6);Le.add(lh,Gs,no);const Za=new J_(1e3);Za.position.set(0,-.6,0);Le.add(Za);const Ja=new pr;Ja.position.y=-.6;const $r=30,Vs=1,Sx=.4,Ex=.62,io=36,Ca=Array.from({length:io},()=>[]),yx=(i,e,t)=>{const n=Math.max(0,Math.min(1,(t-i)/(e-i)));return n*n*(3-2*n)},bx=(i,e)=>{const t=Math.hypot(i,e)/$r;return 1-yx(Ex,1,t)},su=(i,e,t,n)=>{const r=bx((i+t)*.5,(e+n)*.5);if(r<=.01)return;const s=Math.min(io-1,Math.max(0,Math.floor(r*io)));Ca[s].push(i,0,e,t,0,n)},ou=(i,e)=>{const t=Math.sqrt(Math.max(0,$r*$r-i*i)),n=[-t],r=Math.ceil(-t/Vs)*Vs;for(let s=r;s<t;s+=Vs)s>-t&&n.push(s);n.push(t);for(let s=0;s<n.length-1;s++){const a=n[s],o=n[s+1];e?su(a,i,o,i):su(i,a,i,o)}};for(let i=-$r;i<=$r;i+=Vs)ou(i,!0),ou(i,!1);for(let i=0;i<Ca.length;i++){const e=Ca[i];if(!e.length)continue;const t=new jt;t.setAttribute("position",new Ht(e,3));const n=new Bi({color:3817807,opacity:Sx*((i+.5)/io),transparent:!0,depthWrite:!1});Ja.add(new ho(t,n))}Le.add(Ja);const ch=new Ka(.012,8,8);let ze=Gt,qt=new Float32Array,Kr=new Uint32Array,ke=0,_i=new eh(ze),xi=new th(ze,_i.matrix,Ks(ze)),ui=new Float32Array,uh="primitive";const hh=new Uint32Array([0,0]),mt=new w,vr=new w,Hr=new Float32Array(32),au=new w,lu=new Float32Array(Gt),Us=new Float32Array(Gt),Tx=new w,cu=new On,uu=new Un,ha=new at,hu=new at,du=new w,fu=new w,pu=new w,wi=new w,mu=new w,Pa=new w;let br;const Ns=document.getElementById("object-list"),gu=document.getElementById("axis-legend"),Fs=document.getElementById("axis-list"),jn=document.getElementById("status-bar");let wn={x:window.innerWidth-180,y:window.innerHeight-80};const vn={color:12568533,metalness:1,roughness:.05,alpha:1},da=i=>Math.max(0,Math.min(1,i)),Qa=i=>({color:Math.max(0,Math.min(16777215,((i==null?void 0:i.color)??vn.color)>>>0)),metalness:da((i==null?void 0:i.metalness)??vn.metalness),roughness:da((i==null?void 0:i.roughness)??vn.roughness),alpha:da((i==null?void 0:i.alpha)??vn.alpha)}),Tr=i=>({...i});let La=!1,mr=null,Da=null,Gr=null,Ia=null;const Yr=[],Ua=[],Ax=20;let Ar="Hypercube";const on=-1,hi=-2;let qe=on,In=-1,Tt=null,ft=null,xt=null,Li=null,Di=null,Nn=!1;const Rt={pos:new w,rot:new w,scale:new w(1,1,1)};let zi=0,ts=Array.from({length:Gt},(i,e)=>e),Kn=!0,vi=Tr(vn);const I={mode:"none",instIdx:-1,targetVertex:-1,startPos:new w,startRot:new w,startScale:1,startMouse:new Ne,vertexStart:new w,axis:new w,plane:new An,planeHitStart:new w,lastHit:new w,vertexDataStart:null,lockAxis:-1,objectDataStart:null,wPlane:!1,moveOffset:new w},Ct={active:!1,lastX:0,accum:0,prevZoom:Mt.enableZoom,prevPan:Mt.enablePan};let Pt=Array.from({length:ze},(i,e)=>e),vt=0;const zt=()=>Math.max(3,Math.min(W.N,Gt));function el(i){const e=Math.max(0,Math.min(i,Gt));return Array.from({length:e},(t,n)=>n)}function dh(i){const e=Pt.slice(0,zt()),t=e.length?e:el(Gt),n=Math.max(0,Math.min(i,Gt));return Array.from({length:n},(r,s)=>t[(vt+s)%t.length]??s)}function fh(i,e){const t=el(e),n=new Set;return t.map((r,s)=>{const a=i==null?void 0:i[s],l=typeof a=="number"&&Number.isInteger(a)&&a>=0&&a<Gt&&!n.has(a)?a:r;return n.add(l),l})}function tl(i,e,t){const n=i.length/e,r=new Float32Array(Gt*n);for(let s=0;s<e;s++){const a=t[s]??s;for(let o=0;o<n;o++)r[a*n+o]=i[s*n+o]}return r}function nl(i,e){return i>=4?e[i-1]??-1:-1}function ph(i,e){const t=[W.axesX,W.axesY,W.axesZ].map(r=>Math.max(0,Math.min(ze-1,r%ze))),n=t[i>=0?i:0];return n!==e?n:t.find(r=>r!==e)??-1}function mh({x:i,y:e,z:t}){const n=zt(),r=Pt.slice(0,n),s=o=>r.indexOf(o)>=0?o:r[0]??0;W.axesX=s(i),W.axesY=s(e),W.axesZ=s(t);const a=r.indexOf(W.axesX);a>=0&&(vt=a),I.lockAxis=-1,ro(),ns(),is(),dn()}function Na(i){return{pos:i.pos.clone(),rot:i.rot.clone(),scale:i.scale.clone()}}function Fa(){return{N:ze,X:new Float32Array(qt),E:new Uint32Array(Kr),M:ke,source:uh,label:Ar,paramsN:W.N,primitive:W.primitive,axes:{x:W.axesX,y:W.axesY,z:W.axesZ},axesOrder:[...Pt],axesOffset:vt,baseAxisMap:[...ts],baseTransform:Na(Rt),baseOrigN:zi,baseVisible:Kn,baseSurface:Tr(vi),selectedInstance:qe,instances:_e.map(i=>({X:new Float32Array(i.X),E:new Uint32Array(i.E),M:i.M,offset:i.offset.clone(),label:i.label,kind:i.kind,transform:Na(i.transform),originalN:i.originalN,axisMap:[...i.axisMap],visible:i.visible,surface:Tr(i.surface)}))}}function Mi(){Yr.push(Fa()),Yr.length>Ax&&Yr.shift(),Ua.length=0}function _u(i){W.N=i.paramsN,W.primitive=i.primitive,wh(i.N,i.X,i.E,i.source,i.baseOrigN,i.baseAxisMap),Ar=i.label,W.axesX=i.axes.x,W.axesY=i.axes.y,W.axesZ=i.axes.z,Pt=[...i.axesOrder],vt=i.axesOffset,Rt.pos.copy(i.baseTransform.pos),Rt.rot.copy(i.baseTransform.rot),Rt.scale.copy(i.baseTransform.scale),Kn=i.baseVisible,vi=Qa(i.baseSurface),Pe.setSurface(vi),_e.push(...i.instances.map(Ox)),qe=i.selectedInstance>=0&&i.selectedInstance<_e.length?i.selectedInstance:ke>0?on:hi,dn(),Mn(),Zr(),Fn(),Gi(qe)}function wx(i){const e=zt();e<3||(vt=((vt+i)%e+e)%e,mh({x:Pt[vt%e],y:Pt[(vt+1)%e],z:Pt[(vt+2)%e]}))}function gh(i){return i instanceof HTMLElement?i.isContentEditable||["INPUT","TEXTAREA","SELECT"].includes(i.tagName):!1}function Rx(i){if(!(i instanceof HTMLElement))return!1;if(i.isContentEditable||i instanceof HTMLTextAreaElement)return!0;if(i instanceof HTMLInputElement){const e=(i.type||"text").toLowerCase();return e==="text"||e==="search"||e==="url"||e==="tel"||e==="email"||e==="password"||e==="number"}return!1}function Hi(i){var e;return i===on?Kn:((e=_e[i])==null?void 0:e.visible)??!1}function Cx(i,e,t=!0){t&&Hi(i)!==e&&Mi(),i===-1?Kn=e:_e[i]&&(_e[i].visible=e),_h(),!e&&i===qe&&(Tt&&(Le.remove(Tt),Tt=null),xt&&(Le.remove(xt),xt=null),ft&&(Le.remove(ft),ft=null)),Gi(qe)}function _h(){Pe.group.visible=ke>0&&Kn,_e.forEach(i=>{i.renderer.group.visible=i.visible})}function Px(i,e){var r;const t=e.trim();if(!t){Fn();return}const n=i===-1?Ar:(r=_e[i])==null?void 0:r.label;if(!n||n===t){Fn();return}Mi(),i===-1?Ar=t:_e[i].label=t,Fn()}function Lx(i){return`
    <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/>
      <circle cx="12" cy="12" r="2.6"/>
      ${i?"":'<path d="M4 20L20 4"/>'}
    </svg>
  `}function Fn(){if(!Ns)return;const i=[...ke>0?[{idx:-1,label:Ar,dimension:zi||W.N,visible:Kn}]:[],..._e.map((s,a)=>({idx:a,label:s.label,dimension:s.originalN,visible:s.visible}))];Ns.textContent="";const e=document.createElement("h4");e.textContent="Objects",Ns.appendChild(e);const t=document.createElement("table"),n=document.createElement("thead");n.innerHTML='<tr><th></th><th aria-label="Object name"></th><th>Dim</th></tr>',t.appendChild(n);const r=document.createElement("tbody");i.forEach(s=>{const a=document.createElement("tr");a.className=`object-row${s.idx===qe?" active":""}${s.visible?"":" hidden"}`,a.addEventListener("click",()=>Gi(s.idx));const o=document.createElement("td"),l=document.createElement("button");l.className="object-eye",l.type="button",l.title=s.visible?"Hide object":"Show object",l.setAttribute("aria-label",s.visible?`Hide ${s.label}`:`Show ${s.label}`),l.innerHTML=Lx(s.visible),l.addEventListener("click",d=>{d.stopPropagation(),Cx(s.idx,!s.visible)}),o.appendChild(l);const c=document.createElement("td"),u=document.createElement("input");u.className="object-name",u.value=s.label,u.title="Rename object",u.addEventListener("click",d=>d.stopPropagation()),u.addEventListener("keydown",d=>{d.stopPropagation(),d.key==="Enter"?(d.preventDefault(),u.blur()):d.key==="Escape"&&(u.value=s.label,u.blur())}),u.addEventListener("blur",()=>Px(s.idx,u.value)),c.appendChild(u);const h=document.createElement("td");h.textContent=`${s.dimension}`,a.append(o,c,h),r.appendChild(a)}),t.appendChild(r),Ns.appendChild(t),ns()}function Dx(i){return`#${Math.max(0,Math.min(16777215,i>>>0)).toString(16).padStart(6,"0")}`}function xh(i){if(i===on)return ke>0?{surface:vi,renderer:Pe}:null;const e=_e[i];return e?{surface:e.surface,renderer:e.renderer}:null}function Ix(i){Zt&&(Zt.disabled=!i),tn&&(tn.disabled=!i),nn&&(nn.disabled=!i),rn&&(rn.disabled=!i)}function vh(i){!Zt||!tn||!nn||!rn||(La=!0,Zt.value=Dx(i.color),tn.value=`${i.metalness}`,nn.value=`${i.roughness}`,rn.value=`${i.alpha}`,Zs&&(Zs.textContent=Zt.value),Js&&(Js.textContent=i.metalness.toFixed(3)),Qs&&(Qs.textContent=i.roughness.toFixed(3)),eo&&(eo.textContent=i.alpha.toFixed(3)),La=!1)}function Ux(){if(!Xr||mr)return;const i=new ja({canvas:Xr,antialias:!0,alpha:!0});i.setPixelRatio(Math.min(window.devicePixelRatio,2)),i.outputColorSpace=Lt,i.toneMapping=nt.toneMapping,i.toneMappingExposure=nt.toneMappingExposure,i.useLegacyLights=nt.useLegacyLights,i.setClearColor(0,0);const e=new $a;e.environment=Le.environment;const t=new sn(36,1,.1,10);t.position.set(1.8,1.35,1.9),t.lookAt(0,0,0);const n=new $s({color:vn.color,metalness:vn.metalness,roughness:vn.roughness,transparent:!1,opacity:vn.alpha,envMapIntensity:1.8,side:Rn}),r=new ct(new Wi(1,1,1),n);r.rotation.set(.45,.68,0),e.add(r);const s=new Ju(16777215,no.intensity);s.position.copy(no.position);const a=new Qu(16777215,lh.intensity),o=new Ku(Gs.color.getHex(),Gs.groundColor.getHex(),Gs.intensity);e.add(a,o,s),mr=i,Da=e,Gr=t,Ia=r}function Oa(i){if(Ux(),!mr||!Da||!Gr||!Ia||!Xr)return;const e=Math.max(1,Xr.clientWidth),t=Math.max(1,Xr.clientHeight);if(mr.setSize(e,t,!1),Gr.aspect=e/t,Gr.updateProjectionMatrix(),!i){mr.clear();return}const n=Ia.material;n.color.setHex(i.color),n.metalness=i.metalness,n.roughness=i.roughness,n.transparent=i.alpha<.999,n.opacity=i.alpha,n.depthWrite=!n.transparent,n.needsUpdate=!0,mr.render(Da,Gr)}function _o(){if(!Hs)return;const i=xh(qe),e=!!i;Hs.classList.toggle("empty",!i),Hs.classList.toggle("disabled",!e),Ix(e),i?(vh(i.surface),Oa(i.surface)):Oa(null)}function ri(i){if(La)return;const e=xh(qe);if(!e||!Zt||!tn||!nn||!rn)return;const t=Qa({color:Number.parseInt(Zt.value.replace("#",""),16),metalness:Number.parseFloat(tn.value),roughness:Number.parseFloat(nn.value),alpha:Number.parseFloat(rn.value)}),n=e.surface;if(n.color!==t.color||Math.abs(n.metalness-t.metalness)>1e-6||Math.abs(n.roughness-t.roughness)>1e-6||Math.abs(n.alpha-t.alpha)>1e-6){if(i&&Mi(),qe===on)vi=t,Pe.setSurface(vi),Pe.refreshSurface();else{const s=_e[qe];if(!s)return;s.surface=t,s.renderer.setSurface(s.surface),s.renderer.refreshSurface()}vh(t),Oa(t)}}function Nx(){Hs&&(Zt==null||Zt.addEventListener("input",()=>{Zs&&Zt&&(Zs.textContent=Zt.value),ri(!1)}),tn==null||tn.addEventListener("input",()=>{Js&&tn&&(Js.textContent=Number.parseFloat(tn.value).toFixed(3)),ri(!1)}),nn==null||nn.addEventListener("input",()=>{Qs&&nn&&(Qs.textContent=Number.parseFloat(nn.value).toFixed(3)),ri(!1)}),rn==null||rn.addEventListener("input",()=>{eo&&rn&&(eo.textContent=Number.parseFloat(rn.value).toFixed(3)),ri(!1)}),Zt==null||Zt.addEventListener("change",()=>ri(!0)),tn==null||tn.addEventListener("change",()=>ri(!0)),nn==null||nn.addEventListener("change",()=>ri(!0)),rn==null||rn.addEventListener("change",()=>ri(!0)))}function Fx(){const i=Za.geometry.getAttribute("color");if(!i)return;const e=new je(_n[W.axesX%_n.length]),t=new je(_n[W.axesY%_n.length]),n=new je(_n[W.axesZ%_n.length]);i.setXYZ(0,e.r,e.g,e.b),i.setXYZ(1,e.r,e.g,e.b),i.setXYZ(2,t.r,t.g,t.b),i.setXYZ(3,t.r,t.g,t.b),i.setXYZ(4,n.r,n.g,n.b),i.setXYZ(5,n.r,n.g,n.b),i.needsUpdate=!0}function Yn(i){return["X","Y","Z","W","V","U","T","S"][i]??`D${i}`}function ns(){if(Fx(),!gu)return;const i=zt(),e=Array.from({length:i}).map((t,n)=>`<span class="badge" style="background:${_n[n%_n.length]};">${Yn(n)}</span>`).join("");gu.innerHTML=`<h4 style="margin:0 0 6px 0; font-size:12px; color:#e6ecf5;">Axes</h4><div>${e}</div>`}function is(){if(!Fs)return;const i=zt();if(i<1){Fs.innerHTML="";return}const e=Pt.slice(0,i),t=new Set([e[(vt+0)%i],e[(vt+1)%i],e[(vt+2)%i]]),n=e.map((r,s)=>{const a=_n[r%_n.length],o=t.has(r);return`<li draggable="true" data-idx="${s}" class="${o?"active":""}" style="--axis-color:${a};border-top:3px solid ${a};">${Yn(r)}</li>`}).join("");Fs.innerHTML=`<h4>Axis order</h4><ul>${n}</ul>`,Fs.querySelectorAll("li").forEach(r=>{r.addEventListener("dragstart",s=>{var a;(a=s.dataTransfer)==null||a.setData("text/plain",r.dataset.idx||"")}),r.addEventListener("dragover",s=>s.preventDefault()),r.addEventListener("drop",s=>{var u;s.preventDefault();const a=Number(((u=s.dataTransfer)==null?void 0:u.getData("text/plain"))??-1),o=Number(r.dataset.idx??-1);if(a<0||o<0||a===o)return;const l=Pt.splice(a,1)[0];Pt.splice(o,0,l);const c=Pt.slice(0,zt()).indexOf(W.axesX);vt=c>=0?c:0,mh({x:Pt[vt%zt()],y:Pt[(vt+1)%zt()],z:Pt[(vt+2)%zt()]}),is()})})}function Gi(i){let e=i;e===on&&ke<=0&&(e=hi),e>=0&&!_e[e]&&(e=hi),e<hi&&(e=hi),qe=e,In=-1,Nn=!1,Fn(),Tt&&(Le.remove(Tt),Tt=null);const t=n=>{const r=new Bi({color:16754253,transparent:!0,opacity:1,depthTest:!1,depthWrite:!1}),s=new ho(n,r);return s.renderOrder=10,s};if(e===on)ke>0&&(Tt=t(Pe.line.geometry));else if(e>=0){const n=_e[e];Tt=t(n.renderer.line.geometry)}Tt&&!W.editMode&&Hi(e)&&Le.add(Tt),W.editMode?Le.background=mo.clone():Le.background=es.clone(),nt.setClearColor(Le.background),ft&&(Le.remove(ft),ft=null),xt&&(Le.remove(xt),xt=null),W.editMode&&Hi(e)&&xo(e),_o()}function wr(){if(Tt){if(W.editMode||!Hi(qe)){Le.remove(Tt),Tt=null;return}Le.children.includes(Tt)||Le.add(Tt)}}function ro(){Li&&(Le.remove(Li),Li.geometry.dispose(),Li=null),Di&&(Le.remove(Di),Di.geometry.dispose(),Di=null)}function Ba(i,e){if(!e)return new w;let t=0,n=0,r=0;for(let s=0;s<e;s++){const a=s*3;t+=i[a],n+=i[a+1],r+=i[a+2]}return new w(t/e,n/e,r/e)}function Mh(i,e,t){const n=i===-1?null:_e[i],r=n?n.X:qt,s=n?n.M:ke,a=n?n.Y:ui,o=n?n.transform:Rt,l=n?n.originalN:zi||zt(),c=n?n.axisMap:ts;if(e<0||e>=s)return!1;const u=n?n.renderer.positions:Pe.positions,h=e*3;uu.set(o.rot.x,o.rot.y,o.rot.z),cu.setFromEuler(uu),ha.compose(Tx,cu,o.scale),hu.copy(ha).invert(),du.set(u[h],u[h+1],u[h+2]),fu.set(a[e],a[s+e],a[2*s+e]),mu.copy(fu).applyMatrix4(ha),pu.copy(du).sub(mu),wi.copy(t).sub(pu).applyMatrix4(hu);const d=_i.matrix;for(let x=0;x<ze;x++){let b=0;for(let L=0;L<ze;L++)b+=d[x*ze+L]*r[L*s+e];lu[x]=b,Us[x]=b}const m=[W.axesX%ze,W.axesY%ze,W.axesZ%ze].map(x=>Math.max(0,Math.min(ze-1,x))),g=nl(l,c),_=.6;let p=g>=0?lu[g]??0:0;const f=g>=0?m.indexOf(g):-1;if(f>=0){const x=f===0?wi.x:f===1?wi.y:wi.z,b=1+_*x;Math.abs(b)>1e-6&&(p=x/b)}const y=g>=0?1/Math.max(.05,1-_*p):1;for(let x=0;x<3;x++){const b=m[x],L=x===0?wi.x:x===1?wi.y:wi.z;g>=0&&b===g?Us[b]=p:Us[b]=L/y}for(let x=0;x<ze;x++){let b=0;for(let L=0;L<ze;L++)b+=d[L*ze+x]*Us[L];r[x*s+e]=b}return!0}function so(){if(ro(),I.mode==="none")return;const i=I.lockAxis!==-1,e=i?I.lockAxis:0,t=new w(e===0?1:0,e===1?1:0,e===2?1:0);if(!i&&!I.wPlane)return;let n=new w;if(I.targetVertex>=0){const a=I.instIdx===-1?null:_e[I.instIdx],o=a?a.renderer.positions:Pe.positions,l=I.targetVertex*3;n.set(o[l],o[l+1],o[l+2])}else if(I.instIdx===-1&&ke>0)n=Ba(Pe.positions,ke);else if(I.instIdx>=0){const a=_e[I.instIdx];n=Ba(a.renderer.positions,a.M)}const r=3,s=[n.clone().addScaledVector(t,-r),n.clone().addScaledVector(t,r)];if(i){const a=new jt().setFromPoints(s),o=new Bi({color:16754253,linewidth:2,depthTest:!1,transparent:!0,opacity:.9});Li=new Ta(a,o),Li.renderOrder=30,Le.add(Li)}if(I.wPlane){const a=new w(0,0,0);a.copy(t).cross(rt.getWorldDirection(mt).normalize()).normalize(),a.lengthSq()===0&&a.copy(rt.up).normalize();const o=2,l=[n.clone().addScaledVector(a,-o),n.clone().addScaledVector(a,o)],c=new jt().setFromPoints(l),u=new Bi({color:12616956,linewidth:2,depthTest:!1,transparent:!0,opacity:.9});Di=new Ta(c,u),Di.renderOrder=31,Le.add(Di)}}function xo(i){if(!W.editMode||!Hi(i)){xt&&(Le.remove(xt),xt=null),ft&&(Le.remove(ft),ft=null);return}const e=i===-1?Pe:_e[i].renderer,t=i===-1?ke:_e[i].M;if(!e||t<=0)return;xt&&(Le.remove(xt),xt=null);const n=new Qr({color:12568533});xt=new X_(ch,n,t);const r=new Dt,s=e.positions;for(let a=0;a<t;a++){const o=a*3;r.position.set(s[o],s[o+1],s[o+2]),r.updateMatrix(),xt.setMatrixAt(a,r.matrix)}xt.instanceMatrix.needsUpdate=!0,xt.renderOrder=5,Le.add(xt),In>=0&&za(i,In)}function za(i,e){if(!Hi(i))return;if(!ft){const s=new Qr({color:16754253,depthTest:!1});ft=new ct(ch,s),ft.renderOrder=20}ft.scale.setScalar(1.35);const n=(i===-1?Pe:_e[i].renderer).positions,r=e*3;ft.position.set(n[r],n[r+1],n[r+2]),Le.add(ft)}function Sh(){if(qe<0)return;Mi(),_e[qe].renderer.dispose(),_e.splice(qe,1),qe=hi,Tt&&(Le.remove(Tt),Tt=null),Nn=!1,dn(),Mn(),Fn(),Gi(qe)}const _e=[];function Ox(i){const e=new po(Le);e.build(i.M,i.E);const t=Qa(i.surface);return e.setSurface(t),e.setMode(W.renderMode),{renderer:e,Y:new Float32Array(3*i.M),X:new Float32Array(i.X),E:new Uint32Array(i.E),M:i.M,offset:i.offset.clone(),label:i.label,kind:i.kind,transform:Na(i.transform),originalN:i.originalN,axisMap:fh(i.axisMap,i.originalN),visible:i.visible,surface:t}}const Pe=new po(Le);ke>0&&(Pe.build(ke,Kr),Pe.setMode("wireframe"));const W={N:4,primitive:"hypercube",projection:"Canonical",sliceDim:-1,sliceMin:-.5,sliceMax:.5,renderMode:"wireframe",editMode:!1,autoSpin:!1,axesX:0,axesY:1,axesZ:2};xx();const Bx=i=>({...i,_lastTheta:i._lastTheta??0}),zx=[{i:0,j:1,theta:0,auto:!0,speed:.45},{i:2,j:3,theta:0,auto:!0,speed:.31},{i:4,j:5,theta:0,auto:!0,speed:.18}],il=zx.map(Bx);function Hx(){il.forEach(i=>{i.i=Math.min(i.i,ze-1),i.j=Math.min(i.j,ze-1),i.theta=0,i._lastTheta=0})}function Zr(){Zc&&(Zc.textContent=`${W.N}D`),kr&&(kr.disabled=W.N<=3),Wr&&(Wr.disabled=W.N>=Gt)}function oo(i){if(!Number.isFinite(i)){Zr();return}const e=Math.max(3,Math.min(Gt,Math.round(i)));W.N=e;const t=zt();vt=(vt%t+t)%t;const n=Pt.slice(0,t);W.axesX=n[vt%t]??0,W.axesY=n[(vt+1)%t]??1,W.axesZ=n[(vt+2)%t]??2,Zr(),is(),ns()}function Eh(){xr&&(xr.classList.toggle("active",W.editMode),xr.setAttribute("aria-pressed",String(W.editMode)))}function yh(i){W.editMode=i,Le.background=W.editMode?mo.clone():es.clone(),nt.setClearColor(Le.background),Eh(),In=-1,ft&&(Le.remove(ft),ft=null),W.editMode?xo(qe):xt&&(Le.remove(xt),xt=null),wr()}function Gx(){{const i=zt(),e=[W.axesX%i,W.axesY%i,W.axesZ%i].map(n=>Math.max(0,Math.min(i-1,n))),t=new Float32Array(3*ze);t[0*ze+e[0]]=1,t[1*ze+e[1]]=1,t[2*ze+e[2]]=1,xi.setCustomP(t)}}function Mn(){ke>0&&Pe.geometry&&Pe.filterEdgesByDimRange(qt,ze,ke,W.sliceDim,W.sliceMin,W.sliceMax),_e.forEach(i=>{i.renderer.filterEdgesByDimRange(i.X,ze,i.M,W.sliceDim,W.sliceMin,W.sliceMax)}),wr(),W.editMode?Le.background=mo.clone():Le.background=es.clone(),nt.setClearColor(Le.background),W.editMode?xo(qe):xt&&(Le.remove(xt),xt=null)}function fa(i,e){if(e===0)return au.set(0,0,0);let t=0,n=0,r=0;for(let l=0;l<e;l++)t+=i[l],n+=i[e+l],r+=i[2*e+l];const s=t/e,a=n/e,o=r/e;for(let l=0;l<e;l++)i[l]-=s,i[e+l]-=a,i[2*e+l]-=o;return au.set(s,a,o)}function dn(){if(ze>=4){const e=[W.axesX%ze,W.axesY%ze,W.axesZ%ze].map(r=>Math.max(0,Math.min(ze-1,r))),t=.6,n=(r,s,a,o,l,c,u)=>{if(s===0)return;const h=ze,d=_i.matrix,m=nl(c,u);for(let p=0;p<s;p++){for(let x=0;x<h;x++){let b=0;for(let L=0;L<h;L++)b+=d[x*h+L]*r[L*s+p];Hr[x]=b}const f=m>=0?Hr[m]??0:0,y=m>=0?1/Math.max(.05,1-t*f):1;a[0*s+p]=Hr[e[0]]*y,a[1*s+p]=Hr[e[1]]*y,a[2*s+p]=Hr[e[2]]*y}const g=fa(a,s),_=mt.set(o.pos.x+g.x,o.pos.y+g.y,o.pos.z+g.z);l.setTransform(_,new Un(o.rot.x,o.rot.y,o.rot.z),o.scale),l.writeInterleavedFrom(a),l.refreshSurface()};ke>0&&Pe.geometry&&n(qt,ke,ui,Rt,Pe,zi||zt(),ts),_e.forEach(r=>{n(r.X,r.M,r.Y,r.transform,r.renderer,r.originalN,r.axisMap)})}else{if(Gx(),ke>0&&Pe.geometry){xi.project(qt,ke,ui);const e=fa(ui,ke),t=mt.set(Rt.pos.x+e.x,Rt.pos.y+e.y,Rt.pos.z+e.z);Pe.setTransform(t,new Un(Rt.rot.x,Rt.rot.y,Rt.rot.z),Rt.scale),Pe.writeInterleavedFrom(ui),Pe.refreshSurface()}_e.forEach(e=>{xi.project(e.X,e.M,e.Y);const t=fa(e.Y,e.M),n=mt.set(e.transform.pos.x+t.x,e.transform.pos.y+t.y,e.transform.pos.z+t.z);e.renderer.setTransform(n,new Un(e.transform.rot.x,e.transform.rot.y,e.transform.rot.z),e.transform.scale),e.renderer.writeInterleavedFrom(e.Y),e.renderer.refreshSurface()})}_h(),wr(),W.editMode&&xo(qe),so()}function bh(){if(!si)return;const i=W.autoSpin;si.classList.toggle("active",i),si.setAttribute("aria-pressed",String(i)),si.setAttribute("aria-label",i?"Stop auto rotation":"Start auto rotation"),si.title=i?"Stop auto rotation":"Start auto rotation"}function Vx(){_i.reset(),il.forEach(i=>{i.theta=0,i._lastTheta=0})}function Th(i){const e=W.autoSpin;W.autoSpin=i,e&&!i&&(Vx(),dn(),Mn()),bh()}function kx(i){if(!W.autoSpin)return;const e=zt();for(const t of il){if(!t.auto||t.speed===0||t.i===t.j||t.i>=e||t.j>=e)continue;const n=t.speed*i;t.theta+=n,_i.applyGivensLeft(t.i,t.j,n)}}function Ah(i){if(!et)return;Nn=!0,et.innerHTML="";const e=document.createElement("div");e.textContent="Delete?",e.style.padding="8px 12px",e.style.fontWeight="700",et.appendChild(e);const t=document.createElement("button");t.textContent="Confirm",t.onclick=()=>{et.style.display="none",Nn=!1,Sh()};const n=document.createElement("button");n.textContent="Cancel",n.onclick=()=>{Nn=!1,et.style.display="none"},et.appendChild(t),et.appendChild(n);const r=(i==null?void 0:i.clientX)??wn.x,s=(i==null?void 0:i.clientY)??wn.y;et.style.left=`${r}px`,et.style.top=`${s}px`,et.style.display="block"}function Wx(){_e.forEach(i=>i.renderer.dispose()),_e.length=0,qe=hi}function wh(i,e,t,n,r,s){var l;Th(!1),Ct.active=!1,Mt.enableZoom=!0,Mt.enablePan=!0,Mt.enableRotate=!0,Mt.enabled=!0,Mt.reset(),rt.position.set(2.6,1.8,2.6);const a=W.renderMode;uh=n;const o=Gt;ze=o,W.N=Math.min(W.N,Gt),qt=new Float32Array(e),Kr=t.length?new Uint32Array(t):hh,ke=Math.floor(e.length/o),_i=new eh(o),xi=new th(o,_i.matrix,Ks(o)),ui=new Float32Array(3*ke),Wx(),Kn=!0,Rt.pos.set(0,0,0),Rt.rot.set(0,0,0),Rt.scale.set(1,1,1),zi=r??zt(),ts=fh(s,zi),vi=Tr(vn),Pt=Array.from({length:ze},(c,u)=>u),vt=0,W.axesX=Pt[0]??0,W.axesY=Pt[1]??1,W.axesZ=Pt[2]??2,Hx(),W.sliceDim>=o&&(W.sliceDim=o-1),ke>0?(Pe.build(ke,Kr),Pe.setSurface(vi),Pe.setMode(W.renderMode),br&&br(a),dn(),Mn()):(l=Pe.dispose)==null||l.call(Pe),Zr(),Ar=n==="custom"?"Custom":"Hypercube",Fn(),Gi(on),ns(),is()}function Xx(i,e,t="text/plain"){const n=new Blob([e],{type:t}),r=URL.createObjectURL(n),s=document.createElement("a");s.href=r,s.download=i,s.click(),URL.revokeObjectURL(r)}async function Yx(i){try{const e=await i.text(),t=lx(e);if(t.N<3||t.N>8){alert("Only datasets between 3 and 8 dimensions can be visualized.");return}Mi(),W.N=t.N;const n=el(t.N),r=tl(t.X,t.N,n),s=t.edges.length?t.edges:hh;wh(Gt,r,s,"custom",t.N,n)}catch(e){console.error(e),alert(`Import failed: ${e.message}`)}finally{mi&&(mi.value="")}}function qx(){const{Xsrc:i,count:e,Esrc:t}=jx();if(e===0){alert("No data to export");return}Xx("data.json",cx(i,e,ze,t),"application/json")}function jx(){if(qe>=0&&_e[qe]){const i=_e[qe];return{Xsrc:i.X,count:i.M,Esrc:i.E}}return ke>0?{Xsrc:qt,count:ke,Esrc:Kr}:{Xsrc:new Float32Array,count:0,Esrc:new Uint32Array}}function $x(i,e,t,n){const r=[];for(let s=0;s<i;s++){const a=e[s*t+n];r.push(`d${s}: ${a.toFixed(3)}`)}return r}function Rh(i){const e=nt.domElement.getBoundingClientRect();return ci.set((i.clientX-e.left)/e.width*2-1,-((i.clientY-e.top)/e.height)*2+1),iu.setFromNormalAndCoplanarPoint(rt.getWorldDirection(mt).normalize(),Mt.target),li.setFromCamera(ci,rt),li.ray.intersectPlane(iu,ru)?ru.clone():Mt.target.clone()}function Kx(i){if(!Xn)return;const e=nt.domElement.getBoundingClientRect(),t=i.clientX-e.left,n=i.clientY-e.top,r=e.width,s=e.height;let a=-1,o=Number.POSITIVE_INFINITY;const l=(h,d,m,g,_)=>{mt.set(h,d,m).project(rt);const p=(mt.x*.5+.5)*r,f=(-mt.y*.5+.5)*s,y=p-t,x=f-n,b=y*y+x*x;b<o&&(o=b,a=g,c=_)};let c=-1;if(Kn)for(let h=0;h<ke;h++){const d=h*3;l(Pe.positions[d],Pe.positions[d+1],Pe.positions[d+2],h,-1)}_e.forEach((h,d)=>{if(!h.visible)return;const m=h.renderer.positions;for(let g=0;g<h.M;g++){const _=g*3;l(m[_],m[_+1],m[_+2],g,d)}});const u=30*30;if(a>=0&&o<u){const h=c>=0&&_e[c]?{coords:_e[c].X,count:_e[c].M}:{coords:qt,count:ke},d=$x(ze,h.coords,h.count,a);Xn.innerHTML=`<div style="font-weight:600;margin-bottom:4px;">v${a}</div><div>${d.join("<br>")}</div>`,Xn.style.left=`${i.clientX}px`,Xn.style.top=`${i.clientY}px`,Xn.classList.add("visible")}else Xn.classList.remove("visible");if(jn&&I.mode==="none"){const h=(i.clientX-e.left)/e.width*2-1,d=-((i.clientY-e.top)/e.height)*2+1;jn.textContent=`Cursor NDC: (${h.toFixed(3)}, ${d.toFixed(3)})`}}dn();Mn();ns();is();Fn();Le.background=W.editMode?mo.clone():es.clone();nt.setClearColor(Le.background);Zr();Eh();Nx();_o();if(Kc){const i=Array.from(Kc.querySelectorAll("button")),e=n=>nx.includes(n),t=()=>{i.forEach(n=>n.classList.toggle("active",n.dataset.mode===W.renderMode))};br=n=>{W.renderMode=n,Pe.setMode(n),Pe.refreshSurface(),_e.forEach(r=>{r.renderer.setMode(n),r.renderer.refreshSurface()}),_o(),t()},i.forEach(n=>{n.addEventListener("click",()=>{e(n.dataset.mode)&&br(n.dataset.mode)})}),t()}mi&&mi.addEventListener("change",()=>{var e;const i=(e=mi.files)==null?void 0:e[0];i&&Yx(i)});la==null||la.addEventListener("click",()=>mi==null?void 0:mi.click());ca==null||ca.addEventListener("click",()=>qx());xr==null||xr.addEventListener("click",()=>yh(!W.editMode));kr==null||kr.addEventListener("click",()=>oo(W.N-1));Wr==null||Wr.addEventListener("click",()=>oo(W.N+1));ua==null||ua.addEventListener("keydown",i=>{i.stopPropagation(),i.key==="ArrowDown"||i.key==="ArrowLeft"||i.key==="-"||i.key==="_"?(i.preventDefault(),oo(W.N-1)):(i.key==="ArrowUp"||i.key==="ArrowRight"||i.key==="+"||i.key==="=")&&(i.preventDefault(),oo(W.N+1))});si==null||si.addEventListener("click",()=>Th(!W.autoSpin));bh();const Zx=new $_;nt.domElement.addEventListener("pointermove",Kx);nt.domElement.addEventListener("pointermove",i=>{if(wn={x:i.clientX,y:i.clientY},I.mode==="none")return;i.preventDefault();const e=i.clientX-I.startMouse.x,t=i.clientY-I.startMouse.y;if(I.targetVertex>=0){const n=I.instIdx===-1?null:_e[I.instIdx];n?n.renderer.positions:Pe.positions;const r=I.targetVertex*3,s=nt.domElement.getBoundingClientRect();ci.set((i.clientX-s.left)/s.width*2-1,-((i.clientY-s.top)/s.height)*2+1),li.setFromCamera(ci,rt),I.plane.setFromNormalAndCoplanarPoint(rt.getWorldDirection(mt).normalize(),I.planeHitStart);const a=li.ray.intersectPlane(I.plane,mt);if(!a)return;const o=Pa;if(I.mode==="move"){const c=I.lockAxis;o.set(c===1||c===2?I.vertexStart.x:a.x,c===0||c===2?I.vertexStart.y:a.y,c===0||c===1?I.vertexStart.z:a.z),I.lastHit.copy(o)}else if(I.mode==="scale"){const c=a.clone().sub(I.planeHitStart),u=I.vertexStart.clone().sub(I.planeHitStart),h=u.length(),d=c.length(),m=h>1e-6?d/h:1,g=u.multiplyScalar(m).add(I.planeHitStart);o.copy(g),I.lastHit.copy(g)}else if(I.mode==="rotate"){const c=I.vertexStart.clone().sub(I.planeHitStart),u=a.clone().sub(I.planeHitStart),h=Math.atan2(u.y,u.x)-Math.atan2(c.y,c.x),d=new On().setFromAxisAngle(I.axis,h);c.applyQuaternion(d).add(I.planeHitStart),o.copy(c),I.lastHit.copy(c)}else return;if(!Mh(I.instIdx,I.targetVertex,o))return;dn(),Mn();const l=n?n.renderer.positions:Pe.positions;ft&&ft.position.set(l[r],l[r+1],l[r+2]),jn&&(jn.textContent=`Vertex (${I.targetVertex}): (${l[r].toFixed(3)}, ${l[r+1].toFixed(3)}, ${l[r+2].toFixed(3)})`)}else{const n=I.instIdx===-1?Rt:_e[I.instIdx].transform;if(I.mode==="move"){const r=I.instIdx===-1?qt:_e[I.instIdx].X,s=I.objectDataStart,a=I.instIdx===-1?ke:_e[I.instIdx].M;if(s&&a>0){const o=nt.domElement.getBoundingClientRect();ci.set((i.clientX-o.left)/o.width*2-1,-((i.clientY-o.top)/o.height)*2+1),li.setFromCamera(ci,rt);const l=li.ray.intersectPlane(I.plane,mt);if(!l)return;const c=l.clone().add(I.moveOffset).sub(I.planeHitStart);I.lockAxis===0?(c.y=0,c.z=0):I.lockAxis===1?(c.x=0,c.z=0):I.lockAxis===2&&(c.x=0,c.y=0);const u=[W.axesX,W.axesY,W.axesZ];for(let h=0;h<a;h++)for(let d=0;d<3;d++){const g=u[d]%ze*a+h;r[g]=s[g]+c.getComponent(d)}I.lastHit.copy(l)}}else if(I.mode==="rotate")if(I.wPlane&&I.objectDataStart){const r=I.instIdx===-1?null:_e[I.instIdx],s=r?r.X:qt,a=I.objectDataStart,o=r?r.M:ke;if(o>0){const l=r?r.originalN:zi||zt(),c=r?r.axisMap:ts,u=nl(l,c),h=ph(I.lockAxis,u);if(h<0||u<0||h===u)return;const d=(e-t)*.01,m=Math.cos(d),g=Math.sin(d);for(let _=0;_<o;_++){const p=a[h*o+_],f=a[u*o+_];s[h*o+_]=p*m-f*g,s[u*o+_]=p*g+f*m}}}else{const r=e*.005,s=t*.005,a=I.startRot.x,o=I.startRot.y,l=I.startRot.z;I.lockAxis===0?n.rot.set(a+s,o,l):I.lockAxis===1?n.rot.set(a,o+r,l):I.lockAxis===2?n.rot.set(a,o,l+r):n.rot.set(a+s,o+r,l)}else if(I.mode==="scale"){const r=(e-t)*.005,s=Math.max(.1,Math.min(5,I.startScale+r));n.scale.set(s,s,s)}jn&&(jn.textContent=`Object: pos(${n.pos.x.toFixed(3)}, ${n.pos.y.toFixed(3)}, ${n.pos.z.toFixed(3)}) rot(${n.rot.x.toFixed(3)}, ${n.rot.y.toFixed(3)}, ${n.rot.z.toFixed(3)})`)}dn(),Mn(),wr(),so()});nt.domElement.addEventListener("pointerleave",()=>Xn==null?void 0:Xn.classList.remove("visible"));nt.domElement.addEventListener("contextmenu",i=>{if(!et)return;i.preventDefault(),wn={x:i.clientX,y:i.clientY},Nn=!1,et.innerHTML="";const e=Rh(i);if(W.editMode){if(In<0)return;[{label:"Move vertex",mode:"move"}].forEach(s=>{const a=document.createElement("button");a.textContent=s.label,a.onclick=()=>{et.style.display="none",Ha(s.mode,i)},et.appendChild(a)})}else qe===on&&ke>0||qe>=0?[{label:"Move",mode:"move"},{label:"Rotate",mode:"rotate"},{label:"Scale",mode:"scale"},{label:"Delete",onClick:()=>Ah(i)}].forEach(a=>{const o=document.createElement("button");o.textContent=a.label,o.onclick=()=>{if(et.style.display="none",a.onClick){a.onClick();return}Ha(a.mode,i)},et.appendChild(o)}):[{label:"Hypercube",kind:"hypercube"},{label:"Cross polytope",kind:"cross"},{label:"Simplex",kind:"simplex"},{label:"Simplex prism",kind:"simplexPrism"}].forEach(a=>{const o=document.createElement("button");o.textContent=`Add ${a.label}`,o.onclick=()=>{et.style.display="none",Mi();const l=ih(a.kind,W.N),c=dh(W.N),u=tl(l.verts,W.N,c),h=new po(Le);h.build(l.V,l.edges),vr.copy(e);const d=new Float32Array(3*l.V),m=`${a.label} #${_e.length+1}`,g={pos:vr.clone(),rot:new w,scale:new w(1,1,1)},_=Tr(vn);h.setSurface(_),_e.push({renderer:h,Y:d,X:u,E:l.edges,M:l.V,offset:vr.clone(),label:m,kind:a.kind,transform:g,originalN:W.N,axisMap:c,visible:!0,surface:_}),xi.project(u,l.V,d),h.setTransform(g.pos,new Un(g.rot.x,g.rot.y,g.rot.z),g.scale),h.writeInterleavedFrom(d),h.filterEdgesByDimRange(u,Gt,l.V,W.sliceDim,W.sliceMin,W.sliceMax),h.setMode(W.renderMode),dn(),Mn(),br&&br(W.renderMode),Fn()},et.appendChild(o)});const t=Math.min(i.clientX,window.innerWidth-180),n=Math.min(i.clientY,window.innerHeight-150);et.style.left=`${t}px`,et.style.top=`${n}px`,et.style.display=et.innerHTML?"block":"none"});window.addEventListener("click",()=>{Nn||(et&&(et.style.display="none"),Nn=!1)});nt.domElement.addEventListener("wheel",i=>{if(!W.editMode)return;i.preventDefault();const e=i.deltaY>0?1:-1;let t=W.sliceDim+e;t=Math.max(-1,Math.min(ze-1,t)),W.sliceDim=t,Mn()});nt.domElement.addEventListener("mousedown",i=>{if(i.button===1){i.preventDefault(),i.stopPropagation(),Ct.active=!0,Ct.lastX=i.clientX,Ct.accum=0,Ct.prevZoom=Mt.enableZoom,Ct.prevPan=Mt.enablePan,Mt.enableZoom=!1,Mt.enablePan=!1;return}},{capture:!0});nt.domElement.addEventListener("pointerdown",i=>{if(Ct.active)return;if(wn={x:i.clientX,y:i.clientY},I.mode!=="none"){if(i.button===0){if(Mi(),I.startMouse.set(i.clientX,i.clientY),I.targetVertex>=0&&(I.planeHitStart.copy(I.vertexStart),I.plane.setFromNormalAndCoplanarPoint(rt.getWorldDirection(mt).normalize(),I.planeHitStart)),I.targetVertex>=0){const u=I.instIdx,h=u===-1?null:_e[u],d=h?h.renderer.positions:Pe.positions,m=I.targetVertex*3;Pa.set(d[m],d[m+1],d[m+2]),Mh(I.instIdx,I.targetVertex,Pa)}if(I.mode="none",I.vertexDataStart=null,I.lockAxis=-1,ro(),dn(),Mn(),W.editMode&&In>=0&&za(qe,In),wr(),jn)if(I.targetVertex>=0){const u=I.instIdx===-1?null:_e[I.instIdx],h=u?u.renderer.positions:Pe.positions,d=I.targetVertex*3;jn.textContent=`Vertex (${I.targetVertex}) commit: (${h[d].toFixed(3)}, ${h[d+1].toFixed(3)}, ${h[d+2].toFixed(3)})`}else{const u=I.instIdx===-1?Rt:_e[I.instIdx].transform;jn.textContent=`Object commit: pos(${u.pos.x.toFixed(3)}, ${u.pos.y.toFixed(3)}, ${u.pos.z.toFixed(3)})`}}else if(i.button===2){if(I.targetVertex>=0){const u=I.instIdx===-1?null:_e[I.instIdx],h=u?u.renderer.positions:Pe.positions,d=I.targetVertex*3;h[d]=I.vertexStart.x,h[d+1]=I.vertexStart.y,h[d+2]=I.vertexStart.z;const m=u?u.renderer:Pe;if(I.vertexDataStart){const g=u?u.X:qt,_=u?u.M:ke;for(let p=0;p<ze;p++)g[p*_+I.targetVertex]=I.vertexDataStart[p]}u?(xi.project(u.X,u.M,u.Y),u.renderer.writeInterleavedFrom(u.Y),u.renderer.filterEdgesByDimRange(u.X,ze,u.M,W.sliceDim,W.sliceMin,W.sliceMax)):(xi.project(qt,ke,ui),Pe.writeInterleavedFrom(ui),Pe.filterEdgesByDimRange(qt,ze,ke,W.sliceDim,W.sliceMin,W.sliceMax)),m.geometry.getAttribute("position").needsUpdate=!0,m.geometry.computeBoundingBox(),m.geometry.computeBoundingSphere(),ft&&ft.position.set(h[d],h[d+1],h[d+2])}else{const u=I.instIdx===-1?Rt:_e[I.instIdx].transform;I.objectDataStart&&(I.instIdx===-1?qt:_e[I.instIdx].X).set(I.objectDataStart),u.pos.copy(I.startPos),u.rot.copy(I.startRot),u.scale.set(I.startScale,I.startScale,I.startScale)}I.mode="none",I.vertexDataStart=null,I.lockAxis=-1,I.objectDataStart=null,ro(),I.moveOffset.set(0,0,0),dn(),Mn(),wr()}i.preventDefault();return}if(i.button!==0)return;const e=nt.domElement.getBoundingClientRect(),t=i.clientX-e.left,n=i.clientY-e.top,r=e.width,s=e.height,a=(u,h)=>{let d=1/0,m=1/0,g=-1/0,_=-1/0;for(let p=0;p<h;p++){const f=p*3;mt.set(u[f],u[f+1],u[f+2]).project(rt);const y=(mt.x*.5+.5)*r,x=(-mt.y*.5+.5)*s;y<d&&(d=y),y>g&&(g=y),x<m&&(m=x),x>_&&(_=x)}return{minX:d,maxX:g,minY:m,maxY:_}},o=[];if(ke>0){const u=a(Pe.positions,ke),h=t>=u.minX&&t<=u.maxX&&n>=u.minY&&n<=u.maxY,d=(u.maxX-u.minX)*(u.maxY-u.minY);o.push({instIdx:-1,contains:h,area:d,nearestDist2:Number.POSITIVE_INFINITY})}_e.forEach((u,h)=>{if(!u.visible)return;const d=a(u.renderer.positions,u.M),m=t>=d.minX&&t<=d.maxX&&n>=d.minY&&n<=d.maxY,g=(d.maxX-d.minX)*(d.maxY-d.minY);o.push({instIdx:h,contains:m,area:g,nearestDist2:Number.POSITIVE_INFINITY})});let l=-1;const c=o.filter(u=>u.contains&&isFinite(u.area));if(c.length)c.sort((u,h)=>u.area-h.area),l=c[0].instIdx;else{let u=Number.POSITIVE_INFINITY;const h=(m,g,_,p)=>{mt.set(m,g,_).project(rt);const f=(mt.x*.5+.5)*r,y=(-mt.y*.5+.5)*s,x=f-t,b=y-n,L=x*x+b*b;L<u&&(u=L,l=p)};if(Kn)for(let m=0;m<ke;m++){const g=m*3;h(Pe.positions[g],Pe.positions[g+1],Pe.positions[g+2],-1)}_e.forEach((m,g)=>{if(!m.visible)return;const _=m.renderer.positions;for(let p=0;p<m.M;p++){const f=p*3;h(_[f],_[f+1],_[f+2],g)}});const d=35*35;u>=d&&(l=-999)}if(l!==-999){if(Gi(l),W.editMode&&i.button===0){const h=(l===-1?Pe:_e[l].renderer).positions;let d=-1,m=Number.POSITIVE_INFINITY;const g=l===-1?ke:_e[l].M;for(let _=0;_<g;_++){const p=_*3;mt.set(h[p],h[p+1],h[p+2]).project(rt);const f=(mt.x*.5+.5)*r,y=(-mt.y*.5+.5)*s,x=f-t,b=y-n,L=x*x+b*b;L<m&&(m=L,d=_)}In=d,za(l,d)}}else Gi(hi),In=-1,ft&&(Le.remove(ft),ft=null),Tt&&(Le.remove(Tt),Tt=null)});window.addEventListener("pointermove",i=>{if(!Ct.active)return;i.preventDefault();const e=i.clientX-Ct.lastX;Ct.lastX=i.clientX,Ct.accum+=e;const t=35;let n=0;for(;Ct.accum>t;)n++,Ct.accum-=t;for(;Ct.accum<-t;)n--,Ct.accum+=t;n!==0&&wx(n)});window.addEventListener("pointerup",i=>{i.button!==1||!Ct.active||(Ct.active=!1,Ct.accum=0,Mt.enableZoom=Ct.prevZoom,Mt.enablePan=Ct.prevPan)});window.addEventListener("keydown",i=>{const e=i.key.toLowerCase();if(!(i.ctrlKey||i.metaKey))return;const n=e==="z"&&!i.shiftKey,r=e==="y"||e==="z"&&i.shiftKey;if(!(!n&&!r)&&!Rx(i.target)&&I.mode==="none"){if(i.preventDefault(),n){const s=Yr.pop();s&&(Ua.push(Fa()),_u(s))}else if(r){const s=Ua.pop();s&&(Yr.push(Fa()),_u(s))}}});window.addEventListener("keydown",i=>{if(gh(i.target)||I.mode==="none")return;const e=i.key.toLowerCase();if(e==="w"){I.mode==="rotate"&&(i.preventDefault(),I.wPlane=!I.wPlane,so());return}(e==="x"||e==="y"||e==="z")&&(I.lockAxis=e==="x"?0:e==="y"?1:2,so())});window.addEventListener("keydown",i=>{if(!gh(i.target)&&(i.key==="Tab"&&(i.preventDefault(),yh(!W.editMode)),I.mode==="none")){if(i.key==="g"||i.key==="r"||i.key==="s"){i.preventDefault();const e={g:"move",r:"rotate",s:"scale"},t=new PointerEvent("pointerdown",{clientX:wn.x,clientY:wn.y});Ha(e[i.key],t)}else if(i.key.toLowerCase()==="a"&&i.shiftKey){if(i.preventDefault(),!et)return;et.innerHTML="";const e=[{label:"Hypercube",kind:"hypercube"},{label:"Cross polytope",kind:"cross"},{label:"Simplex",kind:"simplex"},{label:"Simplex prism",kind:"simplexPrism"}],t=Rh(new PointerEvent("pointerdown",{clientX:wn.x,clientY:wn.y}));e.forEach(n=>{const r=document.createElement("button");r.textContent=`Add ${n.label}`,r.onclick=()=>{et.style.display="none",Mi();const s=ih(n.kind,W.N),a=dh(W.N),o=tl(s.verts,W.N,a),l=new po(Le);l.build(s.V,s.edges),vr.copy(t);const c=new Float32Array(3*s.V),u=`${n.label} #${_e.length+1}`,h={pos:vr.clone(),rot:new w,scale:new w(1,1,1)},d=Tr(vn);l.setSurface(d),_e.push({renderer:l,Y:c,X:o,E:s.edges,M:s.V,offset:vr.clone(),label:u,kind:n.kind,transform:h,originalN:W.N,axisMap:a,visible:!0,surface:d}),xi.project(o,s.V,c),l.setTransform(h.pos,new Un(h.rot.x,h.rot.y,h.rot.z),h.scale),l.writeInterleavedFrom(c),l.filterEdgesByDimRange(o,Gt,s.V,W.sliceDim,W.sliceMin,W.sliceMax),l.setMode(W.renderMode),dn(),Mn(),Fn()},et.appendChild(r)}),et.style.left=`${wn.x}px`,et.style.top=`${wn.y}px`,et.style.display="block"}else if(i.key==="x"){if(i.preventDefault(),!(qe===on&&ke>0||qe>=0))return;Nn?(Nn=!1,et&&(et.style.display="none"),Sh()):Ah()}}});function Ch(){const i=Math.min(Zx.getDelta(),.05);kx(i),dn(),Mt.update(),go(),nt.render(Le,rt),requestAnimationFrame(Ch)}Ch();function Ha(i,e){var t;if(Hi(qe))if(I.mode=i,I.instIdx=qe,I.targetVertex=W.editMode?In:-1,I.startMouse.set(e.clientX,e.clientY),I.targetVertex>=0){if(I.targetVertex<0){I.mode="none";return}const n=I.instIdx===-1?null:_e[I.instIdx],r=n?n.renderer.positions:Pe.positions,s=I.targetVertex*3;I.vertexStart.set(r[s],r[s+1],r[s+2]);const a=n?n.X:qt;I.vertexDataStart=new Float32Array(ze);for(let o=0;o<ze;o++)I.vertexDataStart[o]=a[o*(n?n.M:ke)+I.targetVertex];I.startScale=1,I.plane.setFromNormalAndCoplanarPoint(rt.getWorldDirection(mt).normalize(),I.vertexStart),I.planeHitStart.copy(I.vertexStart),I.lastHit.copy(I.vertexStart),I.lockAxis=-1,I.wPlane=!1}else{const n=qe===on?Rt:(t=_e[qe])==null?void 0:t.transform;if(!n)return;if(I.startPos.copy(n.pos),I.startRot.copy(n.rot),I.startScale=n.scale.x,I.lockAxis=-1,I.wPlane=!1,i==="move"||i==="rotate"){const r=qe===on?qt:_e[qe].X,s=qe===on?ke:_e[qe].M;if(I.objectDataStart=new Float32Array(r.length),I.objectDataStart.set(r),I.lastHit.set(0,0,0),i==="move"){const a=qe===on?Pe.positions:_e[qe].renderer.positions,o=Ba(a,s);I.planeHitStart.copy(o),I.plane.setFromNormalAndCoplanarPoint(rt.getWorldDirection(mt).normalize(),o);const l=nt.domElement.getBoundingClientRect();ci.set((e.clientX-l.left)/l.width*2-1,-((e.clientY-l.top)/l.height)*2+1),li.setFromCamera(ci,rt);const c=li.ray.intersectPlane(I.plane,mt);c?(I.lastHit.copy(c),I.moveOffset.copy(I.planeHitStart).sub(c)):(I.lastHit.copy(o),I.moveOffset.set(0,0,0))}}else I.objectDataStart=null}}window.addEventListener("resize",()=>{const i=window.innerWidth,e=window.innerHeight;rt.aspect=i/e,rt.updateProjectionMatrix(),nt.setSize(i,e),_o()});
