import{_ as i}from"./MetricValueInput-JW-RSDvs.js";import"./vue.esm-bundler-BAM-3gvP.js";function e(r,h){return{id:`d_${r}`,title:`Drill ${r}`,category:"Test",equipment:{},setup:{schema:"x"},duration:{},instructions:{training:"do it"},metric:{type:r,unit:h,hcpTargets:{}}}}const F={title:"Components/MetricValueInput",component:i,render:r=>({components:{MetricValueInput:i},setup:()=>({args:r}),template:'<MetricValueInput v-bind="args" />'})},a={args:{drill:e("streak","Putts in Folge"),modelValue:0}},s={args:{drill:e("count_in_time","Treffer in 60s"),modelValue:0}},o={args:{drill:e("points_total","Punkte"),modelValue:-1}},t={args:{drill:e("stations_cleared","Stationen"),modelValue:-1}},n={args:{drill:e("corridor_hits","Treffer"),modelValue:-1}},l={args:{drill:e("score_vs_par","Score vs Par"),modelValue:1.5}};var d,c,m;a.parameters={...a.parameters,docs:{...(d=a.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    drill: makeDrill('streak', 'Putts in Folge'),
    modelValue: 0 // invalid: must be > 0
  }
}`,...(m=(c=a.parameters)==null?void 0:c.docs)==null?void 0:m.source}}};var u,p,g;s.parameters={...s.parameters,docs:{...(u=s.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    drill: makeDrill('count_in_time', 'Treffer in 60s'),
    modelValue: 0 // invalid: must be > 0
  }
}`,...(g=(p=s.parameters)==null?void 0:p.docs)==null?void 0:g.source}}};var v,_,I;o.parameters={...o.parameters,docs:{...(v=o.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    drill: makeDrill('points_total', 'Punkte'),
    modelValue: -1 // invalid: must be >= 0
  }
}`,...(I=(_=o.parameters)==null?void 0:_.docs)==null?void 0:I.source}}};var V,S,k;t.parameters={...t.parameters,docs:{...(V=t.parameters)==null?void 0:V.docs,source:{originalSource:`{
  args: {
    drill: makeDrill('stations_cleared', 'Stationen'),
    modelValue: -1 // invalid
  }
}`,...(k=(S=t.parameters)==null?void 0:S.docs)==null?void 0:k.source}}};var f,P,T;n.parameters={...n.parameters,docs:{...(f=n.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    drill: makeDrill('corridor_hits', 'Treffer'),
    modelValue: -1 // invalid
  }
}`,...(T=(P=n.parameters)==null?void 0:P.docs)==null?void 0:T.source}}};var D,C,b;l.parameters={...l.parameters,docs:{...(D=l.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    drill: makeDrill('score_vs_par', 'Score vs Par'),
    modelValue: 1.5 // invalid: must be integer
  }
}`,...(b=(C=l.parameters)==null?void 0:C.docs)==null?void 0:b.source}}};const H=["StreakInvalid","CountInTimeInvalid","PointsTotalInvalid","StationsClearedInvalid","CorridorHitsInvalid","ScoreVsParInvalid"];export{n as CorridorHitsInvalid,s as CountInTimeInvalid,o as PointsTotalInvalid,l as ScoreVsParInvalid,t as StationsClearedInvalid,a as StreakInvalid,H as __namedExportsOrder,F as default};
