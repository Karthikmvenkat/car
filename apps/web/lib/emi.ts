export function calculateEmi(principal:number, annualRate:number, months:number){
  if(!Number.isFinite(principal)||principal<0||!Number.isFinite(annualRate)||annualRate<0||!Number.isInteger(months)||months<1) return null;
  const rate=annualRate/1200;
  const monthly=rate===0?principal/months:principal*rate/(1-Math.pow(1+rate,-months));
  const total=monthly*months;
  if(!Number.isFinite(monthly)||!Number.isFinite(total))return null;
  return {monthly,total,interest:total-principal};
}
