import{_ as d}from"./SparklineLast-Q1WtP4DV.js";import"./vue.esm-bundler-BAM-3gvP.js";import"./Sparkline-DUDhGfSA.js";const v={title:"Components/SparklineLast",component:d,args:{limit:10,width:160,height:32,color:"#2F7A52"}},s={args:{values:[1,2,3,4,5,6,7,8,9,10,11,12,13]}},r={args:{sessions:Array.from({length:14}).map((g,l)=>({id:`s${l}`,result:{value:Math.round(Math.random()*12)}}))}},e={args:{values:[5]}};var a,o,n;s.parameters={...s.parameters,docs:{...(a=s.parameters)==null?void 0:a.docs,source:{originalSource:`{
  args: {
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
  }
}`,...(n=(o=s.parameters)==null?void 0:o.docs)==null?void 0:n.source}}};var t,m,c;r.parameters={...r.parameters,docs:{...(t=r.parameters)==null?void 0:t.docs,source:{originalSource:`{
  args: {
    sessions: Array.from({
      length: 14
    }).map((_, i) => ({
      id: \`s\${i}\`,
      result: {
        value: Math.round(Math.random() * 12)
      }
    }))
  }
}`,...(c=(m=r.parameters)==null?void 0:m.docs)==null?void 0:c.source}}};var i,p,u;e.parameters={...e.parameters,docs:{...(i=e.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    values: [5]
  }
}`,...(u=(p=e.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};const S=["FromValues","FromSessions","FewPoints"];export{e as FewPoints,r as FromSessions,s as FromValues,S as __namedExportsOrder,v as default};
