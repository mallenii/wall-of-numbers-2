import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BigQuery } from '@google-cloud/bigquery';
import { queries } from './queries.js';

dotenv.config();
const app = express();
app.use(cors());
const port = process.env.PORT || 3001;
const useMock = process.env.USE_MOCK_DATA !== 'false';
const bq = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });

const months = ['Jun 2024','Jul 2024','Aug 2024','Sep 2024','Oct 2024','Nov 2024','Dec 2024','Jan 2025','Feb 2025','Mar 2025','Apr 2025','May 2025'];
function mockData(){
  const trend = months.map((m,i)=>({month:m, firft:90.3+i*.22+(i%3)*.35, surveys:1800+i*60, flex:860000+i*22000+(i%3)*50000, mt:520000+i*18000, ap:300000+i*12000, ad:120000+i*8000, roDuration:1.9+(i%5)*.04, powertrain:4.7+(i%4)*.22, endpoint:34000+i*400, uncertified:7200-i*40, totalTech:50000+i*550, left:720-i*10}));
  return { generatedAt:new Date().toISOString(), mode:'mock', kpis:{firft:92.9, repeatRepair:715, roDuration:2, powertrainRate:4.99, endpointTech:48681, activeTech:49329, techLeft:612, uncertified:21394, flexHours:811038.3, distinctClaims:59677, ota:2233, fsa:614, other:0, customerPaid:640733, warranty:78815}, trend,
    payType:[{name:'Customer Paid',value:4.21},{name:'Warranty',value:5.02},{name:'FSA',value:1.87},{name:'Internal (I/S)',value:1.36}],
    roMix:[['Warranty',4.21,'33.8%'],['Customer Paid',2.76,'22.1%'],['Customer Paid + Warranty',1.88,'15.1%'],['FSA',1.67,'13.4%'],['Customer Paid + FSA',0.83,'6.7%'],['FSA + Warranty',0.64,'5.1%'],['Customer Paid + FSA + Warranty',0.47,'3.8%']],
    rrDrivers:[['Powertrain',178],['Engine',132],['Electrical',98],['Body',72],['Brakes',61]],
    wcc:[['U3000 - Battery/Charging System',46],['P0300 - Engine Misfire Detected',38],['P0401 - EGR Flow Insufficient',31],['B1D1A - HV Battery Performance',27],['C1100 - ABS System Malfunction',24]] };
}
function latest(rows){ return rows?.[rows.length-1] || {}; }
async function runQuery(name){ const [rows] = await bq.query({ query: queries[name], location:'US' }); return rows; }
app.get('/api/dashboard', async (_req,res)=>{
  if(useMock) return res.json(mockData());
  try{
    const [flex, roDuration, tech, payType, firft] = await Promise.all(['flexTime','roDuration','tech','payType','firft'].map(runQuery));
    const lf=latest(flex), lt=latest(tech);
    const avgDuration = roDuration.reduce((a,r)=>a+Number(r.RO_Duration_Days||0),0)/Math.max(roDuration.length,1);
    const pwr = roDuration.filter(r=>r.ro_contains_powertrain_part).length/Math.max(roDuration.length,1)*100;
    const firftYes=firft.reduce((a,r)=>a+Number(r.FIRTFT_Yes||0),0), surveys=firft.reduce((a,r)=>a+Number(r.Survey_Count||0),0);
    const data = mockData();
    data.mode='bigquery';
    data.kpis = {...data.kpis, firft: +(firftYes/surveys*100).toFixed(2), roDuration:+avgDuration.toFixed(2), powertrainRate:+pwr.toFixed(2), endpointTech:Number(lt.end_point_tech||0), activeTech:Number(lt.n_current_tech_count_summarized_from_tech_table||0), techLeft:Number(lt.Defect_count_summarized_from_tech_table||0), uncertified:Number(lt.Current_uncertified_count||0), flexHours:Number(lf.Grand_Total_Flex_Time_Hours||0)};
    data.payType = payType.slice(-1).flatMap(r=>[{name:'Customer Paid',value:Number(r.Customer_Paid_ROs||0)},{name:'Warranty',value:Number(r.Warranty_ROs||0)},{name:'FSA',value:Number(r.FSA_ROs||0)},{name:'Internal (I/S)',value:Number(r.Internal_ROs||0)}]);
    res.json(data);
  } catch(err){ const data=mockData(); data.mode='mock-fallback'; data.error=err.message; res.json(data); }
});
app.listen(port,()=>console.log(`API running on http://localhost:${port}`));
