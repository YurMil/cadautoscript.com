function e(e,n=100){let r=`  0
SECTION
  2
HEADER
  9
$ACADVER
  1
AC1009
  0
ENDSEC
  0
SECTION
  2
ENTITIES
`,i=e.totalFlatLength,a=n;return r+=t(0,0,i,0,7),r+=t(i,0,i,a,7),r+=t(i,a,0,a,7),r+=t(0,a,0,0,7),e.segments.forEach((e,n)=>{if(n>0&&e.prevBendAllowance>0){let n=e.bendCenterDistance,i=e.bendDirection>0?3:2;r+=t(n,0,n,a,i)}}),r+=`  0
ENDSEC
  0
EOF
`,r}function t(e,t,n,r,i=7){return`  0
LINE
  8
0
 62
${i}
 10
${e}
 20
${t}
 30
0
 11
${n}
 21
${r}
 31
0
`}export{e as generateDXF};