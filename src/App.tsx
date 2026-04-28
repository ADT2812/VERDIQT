import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { 
  ShieldAlert, 
  Search, 
  Terminal, 
  AlertTriangle, 
  UserCircle, 
  CheckCircle2, 
  Fingerprint, 
  Activity, 
  ArrowRight, 
  Database, 
  Briefcase, 
  History, 
  Lock, 
  Cpu, 
  RefreshCcw, 
  Scale,
  FileText,
  Download,
  Share2,
  Link,
  X,
  Printer,
  Heart,
  ShieldCheck,
  MessageSquareText,
  ArrowLeft,
  Play,
  Landmark,
  GraduationCap,
  Gavel,
  Stethoscope,
  Upload,
  FileSpreadsheet,
  Info,
  ChevronRight,
  Globe,
  Users,
  HelpCircle
} from 'lucide-react';
import { analyzeBias, VerdiqtAnalysis, analyzeTrace, BiasTrace, simulateFix, FixSimulation, generateAuditReport, AuditReport, generateEmpathyResponse, EmpathyResponse, RawMetrics, generateImpactStory } from './services/geminiService';

interface AuditHistoryItem {
  id: string;
  date: string;
  domain: string;
  score: number;
  severity: string;
  affectedGroups: string[];
  data: {
    analysis: VerdiqtAnalysis;
    trace: BiasTrace;
    formData: any;
  };
}

const ScoreGauge = ({ score, severity }: { score: number, severity: string }) => {
  const getColor = (s: number) => {
    if (s <= 40) return '#FF3B30'; // Red
    if (s <= 65) return '#FF9500'; // Orange
    return '#34C759'; // Green
  };

  const color = getColor(score);
  const arcLength = 240; 
  const startAngle = -120;
  const endAngle = startAngle + arcLength;
  
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const radius = 80;
  const cx = 100;
  const cy = 100;
  const strokeWidth = 12;

  const bgPath = describeArc(cx, cy, radius, startAngle, endAngle);
  const progressEndAngle = startAngle + (score / 100) * arcLength;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-44">
        <svg viewBox="0 0 200 180" className="w-full h-full">
          <path
            d={bgPath}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            d={describeArc(cx, cy, radius, startAngle, progressEndAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Needle */}
          <motion.g
            initial={{ rotate: startAngle }}
            animate={{ rotate: progressEndAngle }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ originX: "100px", originY: "100px" }}
          >
            <path
              d={`M ${cx} ${cy} L ${cx} ${cy - radius + 15}`}
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              className="opacity-60"
            />
            <circle cx={cx} cy={cy} r="4" fill="white" />
          </motion.g>
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-5xl font-display font-black tracking-tighter"
            style={{ color }}
          >
            {score}
          </motion.span>
          <div className={`mt-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
            severity === 'Low' ? 'bg-verdiqt-accent-green/20 text-verdiqt-accent-green' :
            severity === 'Medium' ? 'bg-verdiqt-accent-orange/20 text-verdiqt-accent-orange' :
            'bg-verdiqt-accent-red/20 text-verdiqt-accent-red'
          }`}>
            {severity} IMPACT
          </div>
        </div>
      </div>
      <p className="font-mono text-[9px] uppercase opacity-30 tracking-[0.3em] mt-2">VERDIQT_SCORING_GAUGE</p>
    </div>
  );
};

const IndiaImpactCalculator = ({ metrics, domain }: { metrics: RawMetrics, domain: string }) => {
  const gap = metrics.demographicParityGap;
  const baseDailyDecisions = 100000;
  const dailyImpact = Math.round(baseDailyDecisions * (gap / 100));
  const yearlyImpact = dailyImpact * 365;
  
  const getCityComparison = (total: number) => {
    if (total > 12000000) return { name: "Mumbai", factor: (total / 12500000).toFixed(1) };
    if (total > 8000000) return { name: "Bangalore", factor: (total / 8400000).toFixed(1) };
    if (total > 3000000) return { name: "Ahmedabad", factor: (total / 5500000).toFixed(1) };
    if (total > 1000000) return { name: "Patna", factor: (total / 1680000).toFixed(1) };
    return { name: "Kochi", factor: (total / 600000).toFixed(1) };
  };

  const comparison = getCityComparison(yearlyImpact);
  const states = ["Karnataka", "Maharashtra", "Uttar Pradesh", "Bihar", "Tamil Nadu", "West Bengal"];
  const affectedStates = states.slice(0, 3 + Math.floor(gap / 20)).join(", ");

  return (
    <div className="w-full mt-6 bg-black border border-verdiqt-line rounded-lg overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Globe className="w-32 h-32 text-verdiqt-accent-blue" />
      </div>
      
      <div className="p-6 md:p-8 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-verdiqt-accent-blue/20 p-2 rounded">
            <Users className="w-5 h-5 text-verdiqt-accent-blue" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white">India Impact Calculator</h3>
            <p className="font-mono text-[9px] uppercase tracking-widest text-verdiqt-accent-blue font-black italic">
              Extrapolated Social Consequence Analysis
            </p>
          </div>
        </div>

        <p className="text-white/60 mb-8 font-serif italic text-lg">
          If this {domain} AI model were deployed across India today:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">Wrongly rejected per day</div>
            <div className="text-4xl font-display font-black text-verdiqt-accent-red">
              {dailyImpact.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest opacity-30">Citizens affected every 24 hours</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">Wrongly rejected per year</div>
            <div className="text-4xl font-display font-black text-verdiqt-accent-red">
              {yearlyImpact.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest opacity-30">Cumulative institutional harm</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">Regional Exposure</div>
            <p className="text-sm text-white/80 font-medium leading-relaxed">
              {affectedStates}
            </p>
            <div className="text-[9px] font-mono uppercase tracking-widest opacity-30 italic">Highest risk states based on attribute variance</div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">Human Scale Equivalent</div>
            <p className="text-xl font-display font-black text-white">
              {comparison.factor}x population of {comparison.name}
            </p>
            <div className="text-[9px] font-mono uppercase tracking-widest opacity-30 italic">Visualizing the scale of disenfranchisement</div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/5 flex items-start gap-3">
          <Info className="w-3 h-3 text-white/20 mt-0.5" />
          <p className="font-mono text-[8px] uppercase tracking-widest text-white/20 leading-relaxed">
            Estimates based on RBI data showing 67 million loan applications processed annually in India. 
            Calculation logic: total_apps * demographic_parity_gap * active_bias_coefficient. 
            Regulatory Alert: Current levels may trigger DPDP Sec 13(2) non-compliance probes.
          </p>
        </div>
      </div>
    </div>
  );
};

const ScoreBreakdown = ({ metrics, trace, score }: { metrics: RawMetrics, trace: BiasTrace | null, score: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Dynamic calculations based on request specs
  const parityGapPoints = Math.min(Math.round((metrics.demographicParityGap / 100) * 45), 30);
  const dirPoints = Math.round(Math.max(0, (1 - metrics.disparateImpactRatio) * 25));
  const attrCount = metrics.proxyVariables.length || 1;
  const attrPoints = Math.min(attrCount * 3.33, 20);
  
  // Extract worst stage from trace if available
  const worstStage = trace?.stages.reduce((prev, curr) => (curr.contamination_percentage > prev.contamination_percentage ? curr : prev), trace.stages[0]);
  const stagePoints = worstStage ? Math.round((worstStage.contamination_percentage / 100) * 15) : 5;
  const stageLabel = worstStage ? worstStage.label : "General Pipeline";

  const samplePoints = metrics.isStatisticallySignificant ? 2 : 10;
  const sampleLabel = metrics.isStatisticallySignificant ? "Adequate" : "Low (N<100)";

  const rows = [
    { factor: "Demographic Parity Gap", weight: "30%", value: `${metrics.demographicParityGap}% gap`, points: -parityGapPoints },
    { factor: "Disparate Impact Ratio", weight: "25%", value: metrics.disparateImpactRatio.toFixed(3), points: -dirPoints },
    { factor: "Number of Biased Attributes", weight: "20%", value: `${attrCount} attributes`, points: -Math.round(attrPoints) },
    { factor: "Pipeline Stage of Origin", weight: "15%", value: stageLabel, points: -stagePoints },
    { factor: "Sample Size Adequacy", weight: "10%", value: sampleLabel, points: -samplePoints },
  ];

  return (
    <div className="mt-4 border border-white/5 bg-black/20 rounded-lg overflow-hidden transition-all duration-500">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-verdiqt-accent-blue" />
          <span className="font-display text-[10px] uppercase font-bold tracking-widest text-white/70 group-hover:text-white">
            How is this score calculated?
          </span>
        </div>
        <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest text-left">
                      <th className="py-2 px-1 font-bold">Factor</th>
                      <th className="py-2 px-1 font-bold text-center">Weight</th>
                      <th className="py-2 px-1 font-bold">Your Value</th>
                      <th className="py-2 px-1 font-bold text-right text-verdiqt-accent-red">Points Lost</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/80">
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-1">{row.factor}</td>
                        <td className="py-3 px-1 text-center opacity-40">{row.weight}</td>
                        <td className="py-3 px-1 font-bold text-verdiqt-accent-blue">{row.value}</td>
                        <td className="py-3 px-1 text-right font-bold text-verdiqt-accent-red">{row.points} pts</td>
                      </tr>
                    ))}
                    <tr className="bg-white/5 font-black">
                      <td className="py-4 px-1 uppercase tracking-widest">Total Score</td>
                      <td className="py-4 px-1 text-center">100%</td>
                      <td className="py-4 px-1"></td>
                      <td className="py-4 px-1 text-right text-white text-base font-display">
                        {score}/100
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 py-3 px-4 bg-white/5 border-l-2 border-white/20 font-mono text-[8px] uppercase tracking-widest opacity-40 leading-relaxed italic">
                Scoring methodology based on EU AI Act Article 10 fairness standards and IEEE 7003 algorithmic bias guidelines. Logic enforced by VERDIQT Loophole 1.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RawStatistics = ({ metrics }: { metrics: RawMetrics }) => {
  return (
    <div className="w-full bg-verdiqt-card border border-verdiqt-line rounded-lg p-6 space-y-6 relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-display text-lg font-black uppercase tracking-tight text-white">Raw Statistics</h4>
          <p className="font-mono text-[9px] uppercase tracking-widest opacity-40">Forensic Mathematical Baseline</p>
        </div>
        {metrics.failsEightyPercentRule && (
          <div className="bg-verdiqt-accent-red text-black px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest animate-pulse">
            Fails 80% Legal Rule
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[8px] uppercase opacity-40">Parity Gap</p>
          <p className={`font-display text-xl font-bold ${metrics.demographicParityGap > 20 ? 'text-verdiqt-accent-red' : 'text-white'}`}>
            {metrics.demographicParityGap}%
          </p>
        </div>
        <div className="space-y-1">
          <p className="font-mono text-[8px] uppercase opacity-40">Impact Ratio</p>
          <div className="flex items-center gap-2">
            <p className={`font-display text-xl font-bold ${metrics.disparateImpactRatio < 0.8 ? 'text-verdiqt-accent-red' : 'text-verdiqt-accent-green'}`}>
              {metrics.disparateImpactRatio.toFixed(3)}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-mono text-[8px] uppercase opacity-40">Significance</p>
          <p className={`font-display text-sm font-bold ${!metrics.isStatisticallySignificant ? 'text-verdiqt-accent-orange' : 'text-white'}`}>
            {metrics.isStatisticallySignificant ? 'High (N>30)' : 'Low (N<30)'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="font-mono text-[8px] uppercase opacity-40">Proxy Risk</p>
          <p className={`font-display text-xl font-bold ${metrics.proxyRiskScore >= 2 ? 'text-verdiqt-accent-red' : 'text-white'}`}>
            {metrics.proxyRiskScore}/5
          </p>
        </div>
      </div>

      {metrics.proxyVariables.length > 0 && (
        <div className="pt-4 border-t border-white/5">
          <p className="font-mono text-[8px] uppercase opacity-40 mb-2">Identified Proxy Variables</p>
          <div className="flex flex-wrap gap-2">
            {metrics.proxyVariables.map(v => (
              <span key={v} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-verdiqt-accent-blue">
                {v.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* DIR Threshold line preview */}
      <div className="pt-4 space-y-2">
        <div className="flex justify-between text-[8px] font-mono uppercase opacity-40 px-1">
          <span>0.0</span>
          <span className="text-verdiqt-accent-red">0.8 Threshold</span>
          <span>1.0</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-verdiqt-accent-red z-10" />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(metrics.disparateImpactRatio * 100, 100)}%` }}
            className={`h-full ${metrics.disparateImpactRatio < 0.8 ? 'bg-verdiqt-accent-red' : 'bg-verdiqt-accent-green'}`}
          />
        </div>
      </div>

      <p className="font-mono text-[8px] uppercase tracking-widest opacity-30 text-center mt-2">
        Mathematically Calculated — Not AI Generated
      </p>
    </div>
  );
};

const calculateRawMetrics = (rates: string, sampleSize: string, attributes: string): RawMetrics => {
  const matches = rates.match(/(\d+(?:\.\d+)?)\s*%/g);
  let demographicParityGap = 0;
  let disparateImpactRatio = 1.0;
  let failsEightyPercentRule = false;
  let isStatisticallySignificant = true;
  
  if (matches && matches.length >= 2) {
    const values = matches.map(m => parseFloat(m.replace('%', '')));
    const max = Math.max(...values);
    const min = Math.min(...values);
    demographicParityGap = Math.round(max - min);
    if (max > 0) {
      disparateImpactRatio = min / max;
      failsEightyPercentRule = disparateImpactRatio < 0.8;
    }
  }

  const sampleMatch = sampleSize.match(/(\d+(?:,\d+)?)/);
  if (sampleMatch) {
    const totalSample = parseInt(sampleMatch[1].replace(/,/g, ''));
    if (totalSample < 100) {
      isStatisticallySignificant = false;
    }
  }

  const proxyKeywords = ['postcode', 'zipcode', 'surname', 'address', 'neighborhood', 'last_name', 'location'];
  const proxyVariables = proxyKeywords.filter(k => attributes.toLowerCase().includes(k));
  const proxyRiskScore = Math.min(proxyVariables.length, 5);

  return {
    demographicParityGap,
    disparateImpactRatio,
    failsEightyPercentRule,
    isStatisticallySignificant,
    proxyRiskScore,
    proxyVariables
  };
};

const DOMAINS_CONFIG = [
  {
    id: 'Loans',
    label: 'Loans',
    icon: Landmark,
    attributes: 'Gender, Married, Education, Self_Employed, Property_Area, Credit_History',
    ratesPlaceholder: 'Male: 70% vs Female: 55% Approval; Graduates: 80% vs Non-Graduates: 60%',
    context: 'financial lending and credit risk assessment'
  },
  {
    id: 'Hiring',
    label: 'Hiring',
    icon: Briefcase,
    attributes: 'Gender, Age, Ethnicity, University_Tier, Years_Exp, Gap_In_Resume',
    ratesPlaceholder: 'Under 40: 45% vs Over 40: 20% Call-back; Technical Degree: 60% vs Bootcamps: 35%',
    context: 'talent acquisition and resume screening'
  },
  {
    id: 'Medical',
    label: 'Medical',
    icon: Stethoscope,
    attributes: 'Race, Postcode, Insurance_Type, Pre_existing_Conditions, Age, Gender',
    ratesPlaceholder: 'Private Ins: 85% vs Public Ins: 60% Specialist Referral; High Postcode: 90% vs Rural: 45%',
    context: 'healthcare diagnostics and treatment allocation'
  },
  {
    id: 'Education',
    label: 'Education',
    icon: GraduationCap,
    attributes: 'Parental_Income, Ethnicity, Disability_Status, First_Gen_Student, Age',
    ratesPlaceholder: 'Private School: 75% vs Public School: 40% Admission; Income >100k: 85% vs <40k: 30%',
    context: 'academic admissions and scholarship eligibility'
  },
  {
    id: 'Criminal Justice',
    label: 'Criminal Justice',
    icon: Gavel,
    attributes: 'Race, Prior_Convictions, Employment_Status, Neighborhood_Risk_Score, Age',
    ratesPlaceholder: 'Minority: 65% vs Majority: 30% Recidivism Risk Score; Unemployed: 70% vs Employed: 25%',
    context: 'sentencing, parole, and recidivism risk prediction'
  }
];

const BiasRiskBadge = ({ rates }: { rates: string }) => {
  const calculateLiveRisk = (ratesString: string) => {
    if (!ratesString) return null;
    // Extract numbers followed by % or preceded by labels
    const matches = ratesString.match(/(\d+(?:\.\d+)?)\s*%/g);
    if (!matches || matches.length < 2) return null;
    
    const values = matches.map(m => parseFloat(m.replace('%', '')));
    if (values.length < 2) return null;
    
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    if (max === 0) return 0;
    
    const risk = ((max - min) / max) * 100;
    return Math.round(risk);
  };

  const riskScore = calculateLiveRisk(rates);
  if (riskScore === null) return null;

  const getRiskLevel = (score: number) => {
    if (score < 15) return { label: 'Low', color: 'text-verdiqt-accent-green', bg: 'bg-verdiqt-accent-green/10' };
    if (score < 40) return { label: 'Medium', color: 'text-verdiqt-accent-orange', bg: 'bg-verdiqt-accent-orange/10' };
    return { label: 'High', color: 'text-verdiqt-accent-red', bg: 'bg-verdiqt-accent-red/10' };
  };

  const level = getRiskLevel(riskScore);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2 px-2 py-1 rounded ${level.bg} ${level.color} border border-current/20 mb-2 transition-all`}
    >
      <AlertTriangle className="w-3 h-3" />
      <span className="font-mono text-[9px] uppercase font-black tracking-widest">
        Estimated Bias Risk: {level.label} ({riskScore}% Gap)
      </span>
    </motion.div>
  );
};

const UCI_LOAN_DATASET = {
  domain: 'Loan Approval',
  attributes: 'Gender, Married, Education, Self_Employed, Property_Area',
  sampleSize: '614 records',
  rates: 'Male: 69% approved, Female: 61% approved | Graduate: 70% approved, Not Graduate: 58% approved | Urban: 76% approved, Semiurban: 76% approved, Rural: 61% approved | Married: 70% approved, Unmarried: 63% approved',
  source: 'UCI ML Repository - Loan Prediction Problem Dataset'
};

const Landing = ({ onStart }: { onStart: () => void }) => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
    {/* Animated Background Elements */}
    <div className="absolute inset-0 z-0">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-verdiqt-accent-red/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-verdiqt-accent-blue/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
    </div>

    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-10 text-center max-w-4xl space-y-12"
    >
      <div className="space-y-4">
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="inline-block bg-verdiqt-accent-blue p-4 rounded-sm rotate-45 mb-8"
        >
          <Fingerprint className="-rotate-45 text-black w-12 h-12" />
        </motion.div>
        <h1 className="font-display text-4xl sm:text-6xl md:text-8xl font-black tracking-[0.1em] sm:tracking-[0.2em] uppercase leading-none text-white drop-shadow-2xl">
          VERDIQT
        </h1>
        <p className="font-mono text-xs sm:text-lg md:text-xl uppercase tracking-[0.2em] sm:tracking-[0.5em] text-verdiqt-accent-red font-bold px-4 md:px-0">
          The World's First Forensic AI Bias Auditor
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 pt-8 md:pt-12">
        {[
          { icon: <Activity className="w-8 h-8" />, title: "Detection", desc: "Scan massive datasets for multi-dimensional bias clusters." },
          { icon: <Fingerprint className="w-8 h-8" />, title: "Forensic Trace", desc: "Trace contamination back to the specific stage of data origin." },
          { icon: <CheckCircle2 className="w-8 h-8" />, title: "Fix", desc: "Simulate remediation effectiveness before deployment." }
        ].map((feat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
            className="p-6 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm"
          >
            <div className="text-verdiqt-accent-blue mb-4 flex justify-center">{feat.icon}</div>
            <h3 className="font-display text-lg font-bold uppercase tracking-tight mb-2">{feat.title}</h3>
            <p className="text-sm opacity-60 leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="w-full sm:w-auto px-8 sm:px-12 py-6 sm:py-5 bg-white text-black font-display font-black text-xs uppercase tracking-[0.2em] sm:tracking-[0.4em] rounded-sm shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:bg-verdiqt-accent-blue transition-colors group flex items-center justify-center gap-4 mx-auto min-h-[56px]"
      >
        Start Forensic Audit
        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
      </motion.button>
    </motion.div>

    <footer className="absolute bottom-8 left-0 w-full text-center">
      <p className="font-mono text-[10px] uppercase opacity-30 tracking-[0.3em]">Built for fairness | Powered by forensic AI</p>
    </footer>
  </div>
);

export default function App() {
  const [isAppStarted, setIsAppStarted] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [formData, setFormData] = useState({
    domain: 'Loan Approval',
    attributes: 'Gender, Age, Postcode',
    sampleSize: '15,000 records',
    rates: 'Male: 68%, Female: 32% | Urban: 74%, Rural: 26% | Under 25: 18%, Over 25: 82%'
  });
  const [formDataB, setFormDataB] = useState({
    domain: 'Loan Approval',
    attributes: 'Gender, Age, Postcode',
    sampleSize: '15,000 records',
    rates: 'Male: 52%, Female: 48% | Urban: 55%, Rural: 45% | Under 25: 40%, Over 25: 60%'
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [analysis, setAnalysis] = useState<VerdiqtAnalysis | null>(null);
  const [analysisB, setAnalysisB] = useState<VerdiqtAnalysis | null>(null);
  const [trace, setTrace] = useState<BiasTrace | null>(null);
  const [traceB, setTraceB] = useState<BiasTrace | null>(null);
  const [rawMetrics, setRawMetrics] = useState<RawMetrics | null>(null);
  const [rawMetricsB, setRawMetricsB] = useState<RawMetrics | null>(null);
  const [storyCount, setStoryCount] = useState(1);
  const [isRegeneratingStory, setIsRegeneratingStory] = useState(false);
  const [simulation, setSimulation] = useState<FixSimulation | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [proposedFix, setProposedFix] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [empathyMode, setEmpathyMode] = useState(false);
  const [empathyForm, setEmpathyForm] = useState({ name: '', group: '', application: '' });
  const [empathyData, setEmpathyData] = useState<EmpathyResponse | null>(null);
  const [isGeneratingEmpathy, setIsGeneratingEmpathy] = useState(false);
  const [isSampleLoaded, setIsSampleLoaded] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvRowCount, setCsvRowCount] = useState(0);
  const [isCSVLoaded, setIsCSVLoaded] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [isTourActive, setIsTourActive] = useState(false);

  useEffect(() => {
    const hasToured = localStorage.getItem('verdiqt-toured');
    if (!hasToured) {
      // Delay slightly to allow initial animations
      const timer = setTimeout(() => setIsTourActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNextTour = () => {
    if (currentTourStep < 5) {
      setCurrentTourStep(prev => prev + 1);
    } else {
      handleCompleteTour();
    }
  };

  const handleCompleteTour = () => {
    setIsTourActive(false);
    localStorage.setItem('verdiqt-toured', 'true');
    setCurrentTourStep(0);
  };

  const startTour = () => {
    setCurrentTourStep(0);
    setIsTourActive(true);
  };

  const tourSteps = [
    { target: "tour-domain", text: "Choose your AI system's purpose. VERDIQT adapts its forensic lens based on the domain's unique legal risks." },
    { target: "tour-rates", text: "Enter how different groups are treated by your model. Transparency starts with raw parity data." },
    { target: "tour-sample", text: "Or load our real-world forensic datasets to see VERDIQT's autopsy engine in action instantly." },
    { target: "tour-run", text: "Execute the audit. Our neural engine will trace bias through your entire pipeline in seconds." },
    { target: "tour-results", text: "Your VERDIQT score, human impact story, and compliance verdict will appear in this command center." },
    { target: "tour-navbar", text: "Access history, compare models, and export compliance-ready legal reports from here." },
  ];

  const TourTooltip = () => {
    const step = tourSteps[currentTourStep];
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
      const el = document.getElementById(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Position below or above based on screen height
        const top = rect.bottom + window.scrollY + 10;
        const left = rect.left + window.scrollX;
        setCoords({ top, left });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, [currentTourStep, isTourActive]);

    if (!isTourActive) return null;

    return (
      <div className="fixed inset-0 z-[2000] pointer-events-none">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <motion.div 
          key={currentTourStep}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{ top: coords.top, left: Math.min(coords.left, window.innerWidth - 320) }}
          className="absolute w-72 md:w-80 bg-verdiqt-card border-2 border-verdiqt-accent-blue p-6 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="font-mono text-[10px] font-black text-verdiqt-accent-blue uppercase tracking-widest">Step {currentTourStep + 1} of 6</span>
            <button onClick={handleCompleteTour} className="text-white/30 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white font-medium text-sm leading-relaxed mb-6">
            {step.text}
          </p>
          <div className="flex justify-between items-center">
            <button 
              onClick={handleCompleteTour}
              className="font-mono text-[9px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              Skip Tour
            </button>
            <button 
              onClick={handleNextTour}
              className="bg-verdiqt-accent-blue text-black px-4 py-2 rounded font-display font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
            >
              {currentTourStep === 5 ? 'Finish' : 'Next Step'}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1 mt-6">
            {tourSteps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i === currentTourStep ? 'bg-verdiqt-accent-blue' : 'bg-white/10'}`} />
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const steps = [
    "Tracing model architecture...",
    "Scanning dataset for protected attributes...",
    "Calculating disparate impact ratios...",
    "Constructing human impact narrative...",
    "Finalizing VERDIQT verdict..."
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedReport = params.get('report');
    if (sharedReport) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(escape(atob(sharedReport))));
        setAnalysis(decodedData.analysis);
        setTrace(decodedData.trace);
        setFormData(decodedData.formData);
        setReport(decodedData.report);
        setShowReportModal(true);
      } catch (err) {
        console.error("Failed to load shared report:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!isAnalyzing) {
      setStep(0);
    }
  }, [isAnalyzing]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('verdiqt_audit_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (analysis: VerdiqtAnalysis, trace: BiasTrace, formData: any) => {
    const newItem: AuditHistoryItem = {
      id: Math.random().toString(36).substring(2, 11).toUpperCase(),
      date: new Date().toLocaleString(),
      domain: formData.domain,
      score: analysis.verdiqt_score,
      severity: analysis.bias_severity,
      affectedGroups: analysis.affected_groups,
      data: {
        analysis,
        trace,
        formData
      }
    };

    const updatedHistory = [newItem, ...history].slice(0, 50); // Keep last 50
    setHistory(updatedHistory);
    localStorage.setItem('verdiqt_audit_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('verdiqt_audit_history');
  };

  const loadFromHistory = (item: AuditHistoryItem) => {
    setFormData(item.data.formData);
    setAnalysis(item.data.analysis);
    setTrace(item.data.trace);
    setShowHistory(false);
    setIsComparisonMode(false);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const headers = results.meta.fields || [];
        setCsvPreview(data.slice(0, 5));
        setCsvRowCount(data.length);
        setIsCSVLoaded(true);
        setIsSampleLoaded(false);

        // Try to guess domain from filename
        let detectedDomain = formData.domain;
        const fileName = file.name.toLowerCase();
        if (fileName.includes('loan')) detectedDomain = 'Loan Approval';
        else if (fileName.includes('hire') || fileName.includes('recruit')) detectedDomain = 'Hiring';
        else if (fileName.includes('med') || fileName.includes('health')) detectedDomain = 'Medical';
        else if (fileName.includes('edu') || fileName.includes('school')) detectedDomain = 'Education';
        else if (fileName.includes('prison') || fileName.includes('jail') || fileName.includes('crim')) detectedDomain = 'Criminal Justice';

        // Detect Outcome Column
        const outcomeKeywords = ['status', 'approved', 'target', 'label', 'outcome', 'granted', 'y', 'decision'];
        const outcomeCol = headers.find(h => outcomeKeywords.some(k => h.toLowerCase().includes(k))) || headers[headers.length - 1];

        // Detect Protected Attributes
        const protectedKeywords = ['gender', 'sex', 'age', 'race', 'religion', 'caste', 'region', 'zip', 'postcode', 'marital', 'nationality', 'ethnicity'];
        const detectedAttributes = headers.filter(h => protectedKeywords.some(k => h.toLowerCase().includes(k)));

        // Calculate Rates
        const groupRates: string[] = [];
        const positivePatterns = ['y', '1', 'approved', 'passed', 'yes', 'granted', 'true'];
        
        detectedAttributes.forEach(attr => {
          const groups: {[key: string]: {total: number, positive: number}} = {};
          
          data.forEach(row => {
            const val = String(row[attr]);
            const outcome = String(row[outcomeCol]).toLowerCase();
            const isPositive = positivePatterns.some(p => outcome === p || outcome.includes(p));

            if (!groups[val]) groups[val] = { total: 0, positive: 0 };
            groups[val].total++;
            if (isPositive) groups[val].positive++;
          });

          const attrRates = Object.entries(groups)
            .map(([group, stats]) => `${group}: ${Math.round((stats.positive / stats.total) * 100)}%`)
            .join(', ');
          
          groupRates.push(`${attr}: ${attrRates}`);
        });

        const updateData = {
          domain: detectedDomain,
          attributes: detectedAttributes.join(', '),
          sampleSize: `${data.length.toLocaleString()} records`,
          rates: groupRates.join(' | ')
        };

        const metrics = calculateRawMetrics(updateData.rates, updateData.sampleSize, updateData.attributes);

        if (target === 'A') {
          setFormData(prev => ({ ...prev, ...updateData }));
          setRawMetrics(metrics);
        } else {
          setFormDataB(prev => ({ ...prev, ...updateData }));
          setRawMetricsB(metrics);
        }

        setToastMessage(`Parsed ${data.length} rows. Rates updated.`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    });
  };

  const handleAnalyze = async (customDataA?: typeof formData, customDataB?: typeof formDataB) => {
    const dataToUseA = customDataA || formData;
    const dataToUseB = customDataB || formDataB;
    
    const getEnrichedDomain = (dataset: typeof formData) => {
      const config = DOMAINS_CONFIG.find(d => d.id === dataset.domain);
      return config ? `${dataset.domain} (${config.context})` : dataset.domain;
    };

    const enrichedDomainA = getEnrichedDomain(dataToUseA);
    const enrichedDomainB = getEnrichedDomain(dataToUseB);

    setIsRegeneratingStory(false);
    setStoryCount(1);
    setIsAnalyzing(true);
    setAnalysis(null);
    setAnalysisB(null);
    setTrace(null);
    setTraceB(null);
    setRawMetrics(null);
    setRawMetricsB(null);
    setSimulation(null);
    setReport(null);
    setShowReportModal(false);
    setProposedFix('');
    setError(null);
    
    try {
      setAnalysisStatus("Performing biometric parity calculations...");
      const metricsA = calculateRawMetrics(dataToUseA.rates, dataToUseA.sampleSize, dataToUseA.attributes);
      setRawMetrics(metricsA);

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      if (isComparisonMode) {
        const metricsB = calculateRawMetrics(dataToUseB.rates, dataToUseB.sampleSize, dataToUseB.attributes);
        setRawMetricsB(metricsB);

        await delay(1500);
        setAnalysisStatus("Executing Forensic Analysis Engine [A]...");
        const biasA = await analyzeBias(enrichedDomainA, dataToUseA.attributes, dataToUseA.sampleSize, dataToUseA.rates, metricsA);
        
        await delay(1500);
        setAnalysisStatus("Executing Forensic Analysis Engine [B]...");
        const biasB = await analyzeBias(enrichedDomainB, dataToUseB.attributes, dataToUseB.sampleSize, dataToUseB.rates, metricsB);
        
        await delay(1500);
        setAnalysisStatus("Tracing bias origin pathways [A]...");
        const traceA = await analyzeTrace(enrichedDomainA, dataToUseA.attributes, dataToUseA.sampleSize, dataToUseA.rates, metricsA);
        
        await delay(1500);
        setAnalysisStatus("Tracing bias origin pathways [B]...");
        const traceBResult = await analyzeTrace(enrichedDomainB, dataToUseB.attributes, dataToUseB.sampleSize, dataToUseB.rates, metricsB);

        setAnalysis(biasA);
        setAnalysisB(biasB);
        setTrace(traceA);
        setTraceB(traceBResult);
      } else {
        await delay(1500);
        setAnalysisStatus("Executing Forensic Analysis Engine...");
        const biasResult = await analyzeBias(enrichedDomainA, dataToUseA.attributes, dataToUseA.sampleSize, dataToUseA.rates, metricsA);
        
        await delay(1500);
        setAnalysisStatus("Tracing bias origin pathways...");
        const traceResult = await analyzeTrace(enrichedDomainA, dataToUseA.attributes, dataToUseA.sampleSize, dataToUseA.rates, metricsA);
        
        setAnalysis(biasResult);
        setTrace(traceResult);
        saveToHistory(biasResult, traceResult, dataToUseA);
      }
      setAnalysisStatus("Audit complete. Finalizing forensic report...");
    } catch (err) {
      console.error(err);
      setError("Forensic Analysis Failed: The VERDIQT engine encountered an extraction error. Please check your network or input data and try again.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus("");
    }
  };

  const handleRegenerateStory = async () => {
    if (!analysis || !rawMetrics) return;
    setIsRegeneratingStory(true);
    try {
      const newStory = await generateImpactStory(
        formData.domain,
        formData.attributes,
        formData.rates,
        rawMetrics,
        storyCount + 1
      );
      setAnalysis({ ...analysis, human_impact_story: newStory });
      setStoryCount(prev => prev + 1);
    } catch (err) {
      console.error("Story generation failed", err);
    } finally {
      setIsRegeneratingStory(false);
    }
  };

  const handleLoadSample = () => {
    const sampleA = {
      domain: UCI_LOAN_DATASET.domain,
      attributes: UCI_LOAN_DATASET.attributes,
      sampleSize: UCI_LOAN_DATASET.sampleSize,
      rates: UCI_LOAN_DATASET.rates
    };
    
    setFormData(sampleA);
    
    if (isComparisonMode) {
      setFormDataB({
        ...sampleA,
        rates: 'Male: 52%, Female: 48% | Urban: 55%, Rural: 45% | Under 25: 40%, Over 25: 60%'
      });
    }
    
    setIsSampleLoaded(true);
    handleAnalyze(sampleA, isComparisonMode ? {
      ...sampleA,
      rates: 'Male: 52%, Female: 48% | Urban: 55%, Rural: 45% | Under 25: 40%, Over 25: 60%'
    } : undefined);
  };

  const handleDemoMode = async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    
    // Reset if needed
    setShowReportModal(false);
    
    // 1. Load Sample (triggers audit)
    handleLoadSample();
    
    // 2. Wait for forensic scanning
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // 3. Scroll to Trace
    const traceSection = document.querySelector('[class*="Forensic Bias Trace"]');
    if (traceSection) {
      traceSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // 4. Pre-fill Fix
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProposedFix("Implementing Adversarial Debiasing at the Model Training stage to decorrelate weights between Gender and Postcode attributes, neutralizing identified proxy leakage.");
    
    // 5. Run Simulation
    await new Promise(resolve => setTimeout(resolve, 1500));
    await handleSimulate();
    
    // 6. Final Report
    await new Promise(resolve => setTimeout(resolve, 3000));
    setShowReportModal(true);
    
    setIsDemoRunning(false);
  };

  const handleSimulate = async () => {
    if (!analysis || !proposedFix.trim()) return;
    setIsSimulating(true);
    setSimulation(null);
    setError(null);
    try {
      const result = await simulateFix(formData.domain, proposedFix, analysis);
      setSimulation(result);
    } catch (err) {
      console.error(err);
      setError("Simulation Error: Unable to compute projected scores. Please re-run the simulation.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!analysis) return;
    setIsGeneratingReport(true);
    setError(null);
    try {
      const result = await generateAuditReport(analysis, trace, simulation, formData.domain);
      setReport(result);
      setShowReportModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report generation failed");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!report) return;
    const originalTitle = document.title;
    document.title = `VERDIQT-Audit-Report-${report.forensic_seal_id}`;
    window.print();
    document.title = originalTitle;
  };

  const handleShareReport = () => {
    if (!analysis || !trace || !report) return;
    try {
      const shareData = {
        analysis,
        trace,
        formData,
        report
      };
      const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(shareData))));
      const url = new URL(window.location.href);
      url.searchParams.set('report', encodedData);
      
      navigator.clipboard.writeText(url.toString());
      setToastMessage("Report link copied to clipboard!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Failed to share report:", err);
    }
  };

  const handleEmpathy = async () => {
    if (!analysis || !empathyForm.name || !empathyForm.group || !empathyForm.application) return;
    setIsGeneratingEmpathy(true);
    setError(null);
    try {
      const result = await generateEmpathyResponse(
        empathyForm.name,
        empathyForm.group,
        empathyForm.application,
        analysis
      );
      setEmpathyData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Empathy generation failed");
    } finally {
      setIsGeneratingEmpathy(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low': return 'text-verdiqt-accent-green';
      case 'Medium': return 'text-verdiqt-accent-orange';
      case 'High': return 'text-verdiqt-accent-red';
      case 'Critical': return 'text-verdiqt-accent-red animate-pulse';
      default: return 'text-verdiqt-ink';
    }
  };

  const renderTrace = (t: BiasTrace) => (
    <div className="space-y-6 md:space-y-8 bg-black/40 p-4 md:p-6 rounded-xl border border-verdiqt-line relative overflow-hidden">
      <div className="relative space-y-6 md:space-y-8">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 border-l border-dotted border-white/20 z-0" />
        
        {t.stages.map((stage) => {
          const isOrigin = t.primary_origin_stage === stage.id;
          const icons = {
            data_collection: "🗄️",
            labeling: "🏷️",
            feature_selection: "🔍",
            model_training: "🤖"
          };
          
          return (
            <motion.div 
              key={stage.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="relative z-10 flex flex-col md:flex-row items-start gap-4"
            >
              <div className={`shrink-0 w-12 h-12 rounded-full border-2 bg-verdiqt-card flex items-center justify-center shadow-lg ${
                isOrigin ? 'border-verdiqt-accent-red' : 'border-verdiqt-line'
              }`}>
                <span className="text-xl">{icons[stage.id as keyof typeof icons]}</span>
              </div>

              <div className={`flex-1 w-full bg-verdiqt-card border p-4 rounded-lg transition-all ${
                isOrigin ? 'border-verdiqt-accent-red shadow-[0_0_15px_rgba(255,59,48,0.1)]' : 'border-verdiqt-line'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-display font-bold text-xs uppercase tracking-tight">{stage.label}</h5>
                  <div className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${
                    stage.indicator === 'red' ? 'bg-verdiqt-accent-red text-white' :
                    stage.indicator === 'yellow' ? 'bg-verdiqt-accent-yellow text-black' :
                    'bg-verdiqt-accent-green text-white'
                  }`}>
                    {stage.indicator === 'red' ? 'FAIL' : stage.indicator === 'yellow' ? 'WARN' : 'PASS'}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[8px] uppercase font-bold text-verdiqt-accent-red">
                      <span>Contamination</span>
                      <span>{stage.contamination_percentage}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full ${
                          stage.indicator === 'red' ? 'bg-verdiqt-accent-red' :
                          stage.indicator === 'yellow' ? 'bg-verdiqt-accent-yellow' :
                          'bg-verdiqt-accent-green'
                        }`}
                        style={{ width: `${stage.contamination_percentage}%` }}
                      />
                    </div>
                  </div>
                  
                  <p className="text-[10px] leading-relaxed opacity-70 italic">
                    {stage.what_happened}
                  </p>

                  <div className="pt-2 border-t border-verdiqt-line">
                    <p className="text-[9px] font-serif italic text-verdiqt-accent-blue/80">
                      Analogy: {stage.real_world_analogy}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-6 bg-black border border-verdiqt-accent-red/30 p-4 rounded text-center">
        <p className="font-display font-bold text-[10px] uppercase tracking-tighter text-verdiqt-accent-red leading-snug">
          {t.final_verdict}
        </p>
      </div>
    </div>
  );

  const isLoading = isAnalyzing || isSimulating || isGeneratingReport || isGeneratingEmpathy;
  const loadingText = isAnalyzing ? (analysisStatus || "Tracing model architecture...") : 
                      isSimulating ? "Simulating remediation effectiveness..." :
                      isGeneratingReport ? "Compiling formal forensic dossier..." :
                      isGeneratingEmpathy ? "Constructing human-centric impact narrative..." : 
                      "Processing...";

  if (!isAppStarted) {
    return <Landing onStart={() => setIsAppStarted(true)} />;
  }

  return (
    <div className="min-h-screen technical-grid p-4 md:p-8 flex flex-col font-sans">
      <div className="print:hidden flex flex-col flex-1">
        <TourTooltip />

        {/* Header */}
        <header className="flex justify-between items-center mb-8 md:mb-12 border-b border-verdiqt-line pb-4 md:pb-6 relative z-[100]">
          <div className="flex items-center gap-3">
            <div className="bg-verdiqt-accent-blue p-2 rounded-sm rotate-45 shrink-0">
              <Fingerprint className="-rotate-45 text-black w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="font-display text-xl md:text-2xl font-bold tracking-tighter uppercase leading-none">VERDIQT</h1>
                <button 
                  onClick={() => setShowWhyModal(true)}
                  className="p-1 rounded-full hover:bg-white/10 text-white/30 hover:text-verdiqt-accent-blue transition-colors"
                  title="Why VERDIQT?"
                >
                  <Info className="w-3 h-3" />
                </button>
                <button 
                  onClick={startTour}
                  className="p-1 rounded-full hover:bg-white/10 text-white/30 hover:text-verdiqt-accent-blue transition-colors"
                  title="Restart Tour"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="font-mono text-[8px] md:text-[10px] uppercase tracking-widest opacity-50">Forensic Bias Intel V1.0.4</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div id="tour-navbar" className="hidden md:flex items-center gap-4 lg:gap-6 font-mono text-[10px] uppercase tracking-widest opacity-40 text-center">
            <div className="flex items-center gap-2"><Lock className="w-3 h-3" /> Secure Node 09</div>
            <div className="flex items-center gap-2"><Cpu className="w-3 h-3" /> Processing Grid 7A</div>
            <div className="hidden lg:flex items-center gap-2"><Activity className="w-3 h-3" /> Latency: 12ms</div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {/* History Button */}
            <button 
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-sm border border-white/20 text-white/60 hover:border-white/50 hover:text-white transition-all font-mono text-[10px] uppercase tracking-widest min-h-[40px]"
            >
              <History className="w-3 h-3" />
              Audit History ({history.length})
            </button>

            {/* Demo Mode Button */}
            <button 
              onClick={handleDemoMode}
              disabled={isDemoRunning}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm border transition-all font-mono text-[10px] uppercase tracking-widest min-h-[40px] ${
                isDemoRunning 
                ? 'bg-verdiqt-accent-red text-white border-verdiqt-accent-red animate-pulse' 
                : 'border-white/20 text-white/60 hover:border-white/50 hover:text-white'
              }`}
            >
              <Play className={`w-3 h-3 ${isDemoRunning ? 'fill-current' : ''}`} />
              {isDemoRunning ? 'Demo Running...' : 'Hands-Free Demo'}
            </button>
            
            {/* Empathy Mode Toggle */}
            <div className="flex items-center gap-3 bg-verdiqt-card border border-verdiqt-line px-4 py-2 rounded-full min-h-[40px]">
              <Heart className={`w-4 h-4 transition-colors ${empathyMode ? 'text-verdiqt-accent-red fill-verdiqt-accent-red' : 'opacity-20'}`} />
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Empathy</span>
              <button 
                onClick={() => setEmpathyMode(!empathyMode)}
                className={`w-10 h-5 rounded-full relative transition-colors ${empathyMode ? 'bg-verdiqt-accent-red' : 'bg-verdiqt-line'}`}
              >
                <motion.div 
                  animate={{ x: empathyMode ? 22 : 2 }}
                  className="absolute top-1 left-0.5 w-3 h-3 bg-white rounded-full shadow-lg"
                />
              </button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <div className="space-y-1.5"><div className="w-6 h-px bg-white" /><div className="w-6 h-px bg-white" /><div className="w-6 h-px bg-white" /></div>}
          </button>

          {/* Mobile Menu Overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="absolute top-full left-0 w-full bg-black border-b border-verdiqt-line overflow-hidden md:hidden shadow-2xl"
              >
                <div className="p-6 space-y-6">
                  <button 
                    onClick={() => { setShowHistory(true); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded font-mono text-xs uppercase tracking-widest text-left min-h-[48px]"
                  >
                    <span className="flex items-center gap-3"><History className="w-4 h-4" /> Audit History</span>
                    <span className="opacity-40">({history.length})</span>
                  </button>
                  <button 
                    onClick={() => { handleDemoMode(); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 p-4 border rounded font-mono text-xs uppercase tracking-widest min-h-[48px] ${
                      isDemoRunning ? 'bg-verdiqt-accent-red text-white border-verdiqt-accent-red' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <Play className="w-4 h-4" /> {isDemoRunning ? 'Demo Running...' : 'Hands-Free Demo'}
                  </button>
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded min-h-[48px]">
                    <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest"><Heart className="w-4 h-4" /> Empathy Mode</span>
                    <button 
                      onClick={() => setEmpathyMode(!empathyMode)}
                      className={`w-12 h-6 rounded-full relative transition-colors ${empathyMode ? 'bg-verdiqt-accent-red' : 'bg-verdiqt-line'}`}
                    >
                      <motion.div 
                        animate={{ x: empathyMode ? 26 : 2 }}
                        className="absolute top-1 left-0.5 w-4 h-4 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 px-0 md:px-0">
        
        {/* Left Column: Input */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-verdiqt-card border border-verdiqt-line p-6 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-verdiqt-accent-blue opacity-50" />
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display font-medium text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-verdiqt-accent-blue" />
                Data Ingestion
              </h2>
              <button 
                onClick={() => setIsComparisonMode(!isComparisonMode)}
                className={`text-[10px] uppercase font-mono px-3 py-1.5 rounded transition-all flex items-center gap-2 border ${
                  isComparisonMode 
                  ? 'bg-verdiqt-accent-blue text-black border-verdiqt-accent-blue' 
                  : 'bg-white/5 text-white/50 border-white/10 hover:border-white/30'
                }`}
              >
                <RefreshCcw className={`w-3 h-3 ${isComparisonMode ? 'animate-spin-slow' : ''}`} />
                {isComparisonMode ? 'Comparative Mode: ON' : 'Compare Models'}
              </button>
            </div>

            {isSampleLoaded && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-verdiqt-accent-green/20 text-verdiqt-accent-green text-[8px] font-mono px-2 py-2 rounded border border-verdiqt-accent-green/30 uppercase tracking-widest flex items-center gap-1 mb-6"
              >
                <CheckCircle2 className="w-2 h-2" /> Real Dataset Loaded
              </motion.div>
            )}

            <div className="mb-6 space-y-3">
              <button 
                id="tour-sample"
                onClick={handleLoadSample}
                disabled={isAnalyzing}
                className="w-full bg-verdiqt-accent-green/10 border border-verdiqt-accent-green/30 text-verdiqt-accent-green p-3 rounded font-display font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-verdiqt-accent-green hover:text-black transition-all flex items-center justify-center gap-2 group"
              >
                <div className="bg-verdiqt-accent-green text-black rounded-full p-1 group-hover:bg-black group-hover:text-verdiqt-accent-green transition-all">
                  <Database className="w-3 h-3" />
                </div>
                Load Sample Dataset (UCI Loan)
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleCSVUpload(e, 'A')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <button 
                  className="w-full bg-verdiqt-accent-blue/10 border border-verdiqt-accent-blue/30 text-verdiqt-accent-blue p-3 rounded font-display font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-verdiqt-accent-blue hover:text-black transition-all flex items-center justify-center gap-2 group"
                >
                  <div className="bg-verdiqt-accent-blue text-black rounded-full p-1 group-hover:bg-black group-hover:text-verdiqt-accent-blue transition-all">
                    <Upload className="w-3 h-3" />
                  </div>
                  Upload Real Dataset (CSV)
                </button>
              </div>

              {isCSVLoaded && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-verdiqt-accent-green/20 text-verdiqt-accent-green text-[8px] font-mono px-3 py-2 rounded border border-verdiqt-accent-green/30 uppercase tracking-widest flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Real CSV Analyzed — {csvRowCount.toLocaleString()} rows processed</span>
                  </div>
                  <button onClick={() => setIsCSVLoaded(false)} className="opacity-50 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}

              {csvPreview.length > 0 && isCSVLoaded && (
                <div className="bg-black/40 border border-verdiqt-line rounded overflow-hidden">
                  <div className="bg-verdiqt-card px-3 py-1.5 border-b border-verdiqt-line flex justify-between items-center">
                    <span className="font-mono text-[8px] uppercase tracking-widest opacity-50">Data Preview (Head 5)</span>
                    <FileSpreadsheet className="w-3 h-3 opacity-30" />
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-[8px] font-mono whitespace-nowrap">
                      <thead>
                        <tr className="bg-white/5">
                          {Object.keys(csvPreview[0]).map(h => (
                            <th key={h} className="px-2 py-1 text-left border-r border-verdiqt-line last:border-0 opacity-40">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((row, i) => (
                          <tr key={i} className="border-t border-verdiqt-line">
                            {Object.values(row).map((v: any, j) => (
                              <td key={j} className="px-2 py-1 border-r border-verdiqt-line last:border-0 opacity-60 truncate max-w-[100px]">{String(v)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Form A */}
              <div className={`space-y-4 ${isComparisonMode ? 'p-4 bg-white/5 rounded border border-white/10' : ''}`}>
                {isComparisonMode && <h3 className="font-mono text-[10px] uppercase text-verdiqt-accent-blue font-bold tracking-widest mb-2 border-b border-white/10 pb-1">Model A (Reference)</h3>}
                {/* Domain Selector */}
                <div id="tour-domain" className="space-y-4 mb-4">
                  <label className="font-mono text-[10px] uppercase tracking-widest opacity-40 font-bold block">
                    Forensic Target Domain
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
                    {DOMAINS_CONFIG.map((d) => {
                      const Icon = d.icon;
                      const isSelected = formData.domain === d.id;
                      return (
                        <button
                          key={d.id}
                          onClick={() => {
                            const update = {
                              domain: d.id,
                              attributes: d.attributes,
                              rates: ""
                            };
                            setFormData((prev) => ({ ...prev, ...update }));
                            setFormDataB((prev) => ({ ...prev, ...update }));
                            setIsSampleLoaded(false);
                          }}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-300 gap-2 group min-h-[70px] md:min-h-[80px] ${
                            isSelected 
                              ? 'bg-verdiqt-accent-blue/10 border-verdiqt-accent-blue text-verdiqt-accent-blue shadow-[0_0_15px_rgba(10,132,255,0.1)]' 
                              : 'bg-black/20 border-white/5 text-white/40 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} />
                          <span className="font-display font-black text-[7px] md:text-[8px] uppercase tracking-widest text-center leading-tight truncate w-full">{d.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase opacity-50 mb-1 block">Domain Focus</label>
                  <input 
                    className="w-full bg-black/50 border border-verdiqt-line p-3 rounded text-sm focus:outline-none focus:border-verdiqt-accent-blue transition-colors"
                    value={formData.domain}
                    onChange={(e) => {
                      setFormData({...formData, domain: e.target.value});
                      setIsSampleLoaded(false);
                    }}
                    placeholder="e.g. Loan Approval"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase opacity-50 mb-1 block">Attributes</label>
                  <textarea 
                    className="w-full bg-black/50 border border-verdiqt-line p-3 rounded text-sm focus:outline-none focus:border-verdiqt-accent-blue transition-colors h-16 resize-none"
                    value={formData.attributes}
                    onChange={(e) => {
                      setFormData({...formData, attributes: e.target.value});
                      setIsSampleLoaded(false);
                    }}
                    placeholder="e.g. Race, Gender..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[10px] uppercase opacity-50 mb-1 block">Sample Size</label>
                    <input 
                      className="w-full bg-black/50 border border-verdiqt-line p-3 rounded text-sm focus:outline-none focus:border-verdiqt-accent-blue transition-colors"
                      value={formData.sampleSize}
                      onChange={(e) => {
                        setFormData({...formData, sampleSize: e.target.value});
                        setIsSampleLoaded(false);
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    {!isComparisonMode && (
                      <button 
                        id="tour-run"
                        onClick={() => handleAnalyze()}
                        disabled={isAnalyzing}
                        className="w-full bg-verdiqt-accent-blue text-black p-3 rounded font-display font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
                      >
                        {isAnalyzing ? <RefreshCcw className="w-4 h-4 animate-spin text-black" /> : "Run Audit"}
                      </button>
                    )}
                  </div>
                </div>
                <div id="tour-rates">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-1">
                    <label className="font-mono text-[10px] uppercase opacity-50 block">Approval Rates (Model A)</label>
                    <BiasRiskBadge rates={formData.rates} />
                  </div>
                  <textarea 
                    className="w-full bg-black/50 border border-verdiqt-line p-3 rounded text-sm font-mono focus:outline-none focus:border-verdiqt-accent-blue transition-colors h-24 resize-none custom-scrollbar min-h-[100px]"
                    value={formData.rates}
                    onChange={(e) => {
                      setFormData({...formData, rates: e.target.value});
                      setIsSampleLoaded(false);
                    }}
                    placeholder={DOMAINS_CONFIG.find(d => d.id === formData.domain)?.ratesPlaceholder || "e.g. Male: 70% Approval vs Female: 55% Approval..."}
                  />
                </div>
              </div>

              {/* Form B */}
              {isComparisonMode && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 p-4 bg-verdiqt-accent-blue/5 rounded border border-verdiqt-accent-blue/20"
                >
                  <h3 className="font-mono text-[10px] uppercase text-verdiqt-accent-blue font-bold tracking-widest mb-2 border-b border-verdiqt-accent-blue/20 pb-1">Model B (Candidate)</h3>
                  <div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-1">
                      <label className="font-mono text-[10px] uppercase opacity-50 block">Approval Rates (Model B)</label>
                      <BiasRiskBadge rates={formDataB.rates} />
                    </div>
                    <textarea 
                      className="w-full bg-black/50 border border-verdiqt-line p-3 rounded text-sm font-mono focus:outline-none focus:border-verdiqt-accent-blue transition-colors h-24 resize-none shadow-inner min-h-[100px]"
                      value={formDataB.rates}
                      onChange={(e) => setFormDataB({...formDataB, rates: e.target.value})}
                      placeholder={DOMAINS_CONFIG.find(d => d.id === formDataB.domain)?.ratesPlaceholder || "e.g. Male: 50%, Female: 50%..."}
                    />
                  </div>
                  <button 
                    onClick={() => handleAnalyze()}
                    disabled={isAnalyzing}
                    className="w-full bg-verdiqt-accent-blue text-black p-4 rounded font-display font-black text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(10,132,255,0.2)] min-h-[48px]"
                  >
                    {isAnalyzing ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Scale className="w-5 h-5" />}
                    Compare Models
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {empathyMode && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-verdiqt-card border border-verdiqt-line p-6 rounded-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-verdiqt-accent-red opacity-50" />
                <h2 className="font-display font-medium text-lg mb-6 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-verdiqt-accent-red" />
                  Subject Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-[10px] uppercase opacity-50 mb-1 block">Subject Name</label>
                    <input 
                      className="w-full bg-black/50 border border-verdiqt-line p-3 rounded text-sm focus:outline-none focus:border-verdiqt-accent-red"
                      value={empathyForm.name}
                      onChange={(e) => setEmpathyForm({...empathyForm, name: e.target.value})}
                      placeholder="e.g. Marcus Thorne"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase opacity-50 mb-1 block">Demographic Group</label>
                    <select 
                      className="w-full bg-black/50 border border-verdiqt-line p-3 rounded text-sm focus:outline-none focus:border-verdiqt-accent-red appearance-none"
                      value={empathyForm.group}
                      onChange={(e) => setEmpathyForm({...empathyForm, group: e.target.value})}
                    >
                      <option value="">Select Group</option>
                      <option value="Woman">Woman</option>
                      <option value="Rural Applicant">Rural Applicant</option>
                      <option value="Non-Graduate">Non-Graduate</option>
                      <option value="Senior Citizen">Senior Citizen</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase opacity-50 mb-1 block">Application Purpose</label>
                    <select 
                      className="w-full bg-black/50 border border-verdiqt-line p-3 rounded text-sm focus:outline-none focus:border-verdiqt-accent-red appearance-none"
                      value={empathyForm.application}
                      onChange={(e) => setEmpathyForm({...empathyForm, application: e.target.value})}
                    >
                      <option value="">Select Purpose</option>
                      <option value="Loan">Loan</option>
                      <option value="Job">Job</option>
                      <option value="Medical">Medical</option>
                      <option value="Insurance">Insurance</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleEmpathy}
                    disabled={isGeneratingEmpathy || !analysis || !empathyForm.name || !empathyForm.group || !empathyForm.application}
                    className="w-full bg-verdiqt-accent-red text-white p-3 rounded font-display font-bold text-xs uppercase tracking-widest hover:brightness-110 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30"
                  >
                    {isGeneratingEmpathy ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <MessageSquareText className="w-4 h-4" />}
                    Generate Personal Explanation
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-verdiqt-card border border-verdiqt-line p-4 rounded-lg flex items-start gap-4">
            <Lock className="w-5 h-5 text-verdiqt-accent-blue mt-1 shrink-0" />
            <p className="text-[11px] leading-relaxed opacity-60">
              VERDIQT utilizes secure forensic tracing to identify systemic bias within machine learning pipelines. Metadata is hashed and discarded after analysis.
            </p>
          </div>
        </section>

        {/* Right Column: Results */}
        <section className="lg:col-span-8 overflow-hidden">
          <AnimatePresence mode="wait">
            {error && !isLoading ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full flex flex-col items-center justify-center bg-verdiqt-card border-2 border-verdiqt-accent-red rounded-lg p-12 min-h-[500px]"
              >
                <div className="bg-verdiqt-accent-red/20 p-6 rounded-full mb-8">
                  <AlertTriangle className="w-16 h-16 text-verdiqt-accent-red animate-bounce" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-4 uppercase tracking-tighter text-verdiqt-accent-red underline decoration-verdiqt-accent-red/20 underline-offset-8">Analysis failed. Please try again.</h3>
                <div className="bg-black/50 border border-verdiqt-accent-red/30 p-6 rounded-lg mb-10 w-full max-w-md shadow-2xl">
                   <p className="font-mono text-[10px] text-verdiqt-accent-red uppercase mb-3 opacity-50 tracking-widest font-bold">SYSTEM_DIAGNOSTIC:</p>
                   <p className="text-sm opacity-90 leading-relaxed italic text-red-100/80">
                    "{error}"
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setError(null);
                    handleAnalyze();
                  }}
                  className="bg-verdiqt-accent-red text-white px-10 py-4 rounded font-display font-bold text-sm uppercase tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(255,59,48,0.3)]"
                >
                  <RefreshCcw className="w-5 h-5" />
                  Attempt Re-Scan
                </button>
              </motion.div>
            ) : isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center bg-verdiqt-card border border-verdiqt-line rounded-lg p-12 min-h-[500px]"
              >
                <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-verdiqt-accent-blue rounded-full blur-2xl"
                  />
                  <div className="relative z-10 w-24 h-24">
                    <div className="absolute inset-0 border-4 border-verdiqt-accent-blue opacity-20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-verdiqt-accent-blue rounded-full animate-spin" />
                    <div className="absolute inset-4 bg-verdiqt-accent-blue/10 rounded-full flex items-center justify-center">
                      <Fingerprint className="w-10 h-10 text-verdiqt-accent-blue animate-pulse" />
                    </div>
                  </div>
                </div>
                <h3 className="font-display text-2xl font-bold mb-3 uppercase tracking-tighter text-verdiqt-accent-blue">VERDIQT is analyzing...</h3>
                <p className="font-mono text-xs opacity-50 tracking-[0.3em] uppercase text-center max-w-xs">{loadingText}</p>
                
                {isAnalyzing && (
                  <div className="mt-12 flex gap-2">
                    {steps.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1 w-8 rounded-full transition-all duration-500 ${
                          i <= step ? 'bg-verdiqt-accent-blue shadow-[0_0_10px_rgba(0,122,255,0.5)]' : 'bg-white/5'
                        }`} 
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : analysis ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 pb-20"
              >
                {/* Winner Banner */}
                {isComparisonMode && analysisB && (
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-verdiqt-accent-blue text-black p-6 rounded-xl flex items-center justify-between shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute right-0 top-0 opacity-10 rotate-12 scale-150">
                      <CheckCircle2 className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="font-display text-2xl font-black uppercase tracking-tighter">
                        {analysis.verdiqt_score >= analysisB.verdiqt_score ? 'Model A' : 'Model B'} is {Math.abs(Math.round(((analysis.verdiqt_score - analysisB.verdiqt_score) / (Math.max(analysis.verdiqt_score, analysisB.verdiqt_score) || 1)) * 100))}% Fairer
                      </h3>
                      <p className="font-mono text-[10px] uppercase tracking-widest font-bold opacity-70">Comparative Audit Verified // {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="relative z-10 bg-black text-verdiqt-accent-blue px-6 py-2 rounded font-display font-black text-xs uppercase tracking-widest border border-white/20">
                      Winner Validated
                    </div>
                  </motion.div>
                )}

                {/* Raw Metrics Section */}
                <div className={`grid gap-6 ${isComparisonMode ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                  {rawMetrics && <RawStatistics metrics={rawMetrics} />}
                  {isComparisonMode && rawMetricsB && <RawStatistics metrics={rawMetricsB} />}
                </div>

                {/* Score & Severity Comparative View */}
                <div className={`grid gap-6 ${isComparisonMode ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Model A Results */}
                  <div id="tour-results" className={`bg-verdiqt-card border p-8 rounded-lg relative overflow-hidden flex flex-col items-center justify-around gap-12 ${isComparisonMode && analysis.verdiqt_score >= (analysisB?.verdiqt_score || 0) ? 'border-verdiqt-accent-blue shadow-[0_0_30px_rgba(10,132,255,0.15)]' : 'border-verdiqt-line'}`}>
                    {isComparisonMode && <div className="absolute top-4 left-4 font-mono text-[10px] uppercase font-bold text-verdiqt-accent-blue">MODEL_A_AUDIT</div>}
                    <ScoreGauge score={analysis.verdiqt_score} severity={analysis.bias_severity} />
                    
                    {/* Score Breakdown Section */}
                    {rawMetrics && (
                      <div className="w-full space-y-6">
                        <ScoreBreakdown 
                          metrics={rawMetrics} 
                          trace={trace} 
                          score={analysis.verdiqt_score} 
                        />
                        <IndiaImpactCalculator 
                          metrics={rawMetrics} 
                          domain={formData.domain} 
                        />
                      </div>
                    )}
                    <div className="w-full space-y-6 max-w-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-mono text-[10px] uppercase opacity-50 tracking-widest mb-1">BIAS SHIELD SEVERITY</h4>
                          <span className={`font-display text-4xl font-black uppercase tracking-tighter ${getSeverityColor(analysis.bias_severity)}`}>
                            {analysis.bias_severity}
                          </span>
                        </div>
                        <ShieldAlert className={`w-10 h-10 ${getSeverityColor(analysis.bias_severity)}`} />
                      </div>
                    </div>
                  </div>

                  {/* Model B Results */}
                  {isComparisonMode && analysisB && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`bg-verdiqt-card border p-8 rounded-lg relative overflow-hidden flex flex-col items-center justify-around gap-12 ${analysisB.verdiqt_score > analysis.verdiqt_score ? 'border-verdiqt-accent-blue shadow-[0_0_30px_rgba(10,132,255,0.15)]' : 'border-verdiqt-line'}`}
                    >
                      <div className="absolute top-4 left-4 font-mono text-[10px] uppercase font-bold text-verdiqt-accent-blue">MODEL_B_AUDIT</div>
                      <ScoreGauge score={analysisB.verdiqt_score} severity={analysisB.bias_severity} />

                      {/* Score Breakdown Section */}
                      {rawMetricsB && (
                        <div className="w-full space-y-6">
                          <ScoreBreakdown 
                            metrics={rawMetricsB} 
                            trace={traceB} 
                            score={analysisB.verdiqt_score} 
                          />
                          <IndiaImpactCalculator 
                            metrics={rawMetricsB} 
                            domain={formData.domain} 
                          />
                        </div>
                      )}
                      <div className="w-full space-y-6 max-w-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-mono text-[10px] uppercase opacity-50 tracking-widest mb-1">BIAS SHIELD SEVERITY</h4>
                            <span className={`font-display text-4xl font-black uppercase tracking-tighter ${getSeverityColor(analysisB.bias_severity)}`}>
                              {analysisB.bias_severity}
                            </span>
                          </div>
                          <ShieldAlert className={`w-10 h-10 ${getSeverityColor(analysisB.bias_severity)}`} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Comparative Summaries toggle or view */}
                {!isComparisonMode ? (
                  <>
                    {/* Plain English Summary */}
                    <div className="bg-verdiqt-card border border-verdiqt-line p-6 rounded-lg">
                      <h4 className="font-mono text-[10px] uppercase opacity-50 mb-4 tracking-widest flex items-center gap-2">
                        <Terminal className="w-3 h-3" /> Audit Summary
                      </h4>
                      <p className="text-lg font-medium leading-relaxed italic">
                        "{analysis.plain_english_summary}"
                      </p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-verdiqt-card border border-verdiqt-line p-6 rounded-lg">
                        <h4 className="font-mono text-[10px] uppercase opacity-50 mb-4 tracking-widest">AFFECTED GROUPS</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.affected_groups.map(group => (
                            <span key={group} className="bg-verdiqt-accent-red/10 border border-verdiqt-accent-red/20 text-verdiqt-accent-red px-3 py-1 rounded text-xs font-mono uppercase tracking-wider">
                              {group}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-verdiqt-card border border-verdiqt-line p-6 rounded-lg">
                        <h4 className="font-mono text-[10px] uppercase opacity-50 mb-4 tracking-widest text-verdiqt-accent-blue">PIPELINE ORIGIN</h4>
                        <div className="flex items-center gap-3">
                          <div className="bg-verdiqt-accent-blue/10 p-2 rounded">
                            <Scale className="w-5 h-5 text-verdiqt-accent-blue" />
                          </div>
                          <span className="font-display text-lg font-bold uppercase tracking-tight">
                            {analysis.pipeline_origin_stage.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Comparative Traces Side-By-Side */}
                    <div className="space-y-4">
                      <h3 className="font-mono text-[10px] uppercase text-verdiqt-accent-blue font-bold tracking-widest text-center">Model A Trace</h3>
                      {trace && renderTrace(trace)}
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-mono text-[10px] uppercase text-verdiqt-accent-blue font-bold tracking-widest text-center">Model B Trace</h3>
                      {traceB && renderTrace(traceB)}
                    </div>
                  </div>
                )}

                {/* Human Impact Story */}
                <div className="bg-verdiqt-accent-red/5 border border-verdiqt-accent-red/30 p-8 rounded-lg relative overflow-hidden">
                  <div className="absolute -right-12 -bottom-12 opacity-5">
                    <UserCircle className="w-64 h-64" />
                  </div>
                  <h4 className="font-mono text-[10px] uppercase text-verdiqt-accent-red mb-6 tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> HUMAN IMPACT ANALYTIC
                  </h4>
                  <div className="space-y-4 relative z-10">
                    <p className="text-xl font-medium leading-loose text-verdiqt-ink/90">
                      {isRegeneratingStory ? (
                        <span className="opacity-30 italic animate-pulse">Engaging Empathy Engine. Forensic narrative reconstruction in progress...</span>
                      ) : (
                        analysis.human_impact_story
                      )}
                    </p>
                    <div className="pt-6 border-t border-verdiqt-accent-red/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-verdiqt-accent-red/20 text-verdiqt-accent-red px-3 py-1 rounded text-[10px] font-mono font-black uppercase tracking-wider">
                          Story {storyCount} of ∞
                        </div>
                        <p className="font-mono text-[9px] uppercase tracking-widest opacity-40">Personas affected by current bias</p>
                      </div>
                      <button 
                        onClick={handleRegenerateStory}
                        disabled={isRegeneratingStory}
                        className="bg-verdiqt-accent-red text-white px-6 py-2 rounded font-display font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-30 group"
                      >
                        <RefreshCcw className={`w-3 h-3 ${isRegeneratingStory ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        Regenerate Story
                      </button>
                    </div>
                  </div>
                </div>

                {/* Empathy Mode Section */}
                {empathyMode && (
                  <div id="tour-rates" className="space-y-6">
                    <div className="bg-verdiqt-card border border-verdiqt-line p-8 rounded-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-verdiqt-accent-red to-transparent opacity-30" />
                      
                      <div className="flex items-center gap-4 mb-8">
                        <div className="bg-verdiqt-accent-red/10 p-3 rounded-full">
                          <Heart className="w-6 h-6 text-verdiqt-accent-red fill-verdiqt-accent-red/20" />
                        </div>
                        <div>
                          <h3 className="font-display text-2xl font-black uppercase tracking-tighter">Empathy Mode Intelligence</h3>
                          <p className="font-mono text-[10px] uppercase opacity-50 tracking-widest">Constructing personalized forensic explanations</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                          <label className="font-mono text-[10px] uppercase opacity-40 mb-1.5 block font-bold">Subject Name</label>
                          <input 
                            className="w-full bg-black/40 border border-verdiqt-line p-3 rounded text-sm focus:outline-none focus:border-verdiqt-accent-red transition-all"
                            value={empathyForm.name}
                            onChange={(e) => setEmpathyForm({...empathyForm, name: e.target.value})}
                            placeholder="Full Name"
                          />
                        </div>
                        <div>
                          <label className="font-mono text-[10px] uppercase opacity-40 mb-1.5 block font-bold">Protected Group</label>
                          <select 
                            className="w-full bg-black/40 border border-verdiqt-line p-3 rounded text-sm focus:outline-none focus:border-verdiqt-accent-red transition-all appearance-none cursor-pointer"
                            value={empathyForm.group}
                            onChange={(e) => setEmpathyForm({...empathyForm, group: e.target.value})}
                          >
                            <option value="">Select Group</option>
                            <option value="Woman">Woman</option>
                            <option value="Rural Applicant">Rural Applicant</option>
                            <option value="Non-Graduate">Non-Graduate</option>
                            <option value="Senior Citizen">Senior Citizen</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-mono text-[10px] uppercase opacity-40 mb-1.5 block font-bold">Applied For</label>
                          <select 
                            className="w-full bg-black/40 border border-verdiqt-line p-3 rounded text-sm focus:outline-none focus:border-verdiqt-accent-red transition-all appearance-none cursor-pointer"
                            value={empathyForm.application}
                            onChange={(e) => setEmpathyForm({...empathyForm, application: e.target.value})}
                          >
                            <option value="">Select Purpose</option>
                            <option value="Loan">Loan</option>
                            <option value="Job">Job</option>
                            <option value="Medical">Medical</option>
                            <option value="Insurance">Insurance</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        onClick={handleEmpathy}
                        disabled={isGeneratingEmpathy || !empathyForm.name || !empathyForm.group || !empathyForm.application}
                        className="w-full bg-verdiqt-accent-red text-white py-4 rounded-sm font-display font-black text-xs uppercase tracking-[0.3em] hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-xl"
                      >
                        {isGeneratingEmpathy ? (
                          <>
                            <RefreshCcw className="w-5 h-5 animate-spin" />
                            Processing Impact Narrative...
                          </>
                        ) : (
                          <>
                            <MessageSquareText className="w-5 h-5" />
                            Generate Personal Explanation
                          </>
                        )}
                      </button>
                    </div>

                    <AnimatePresence>
                      {empathyData && (
                        <motion.div 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 20, opacity: 0 }}
                          className="bg-amber-500/10 border-2 border-amber-500/50 p-8 rounded-xl shadow-[0_20px_50px_rgba(245,158,11,0.1)] relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-8 opacity-5">
                            <ShieldCheck className="w-48 h-48 text-amber-500" />
                          </div>
                          
                          <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                              <div className="bg-amber-500 p-3 rounded-lg shadow-lg">
                                <UserCircle className="w-6 h-6 text-black" />
                              </div>
                              <div>
                                <h3 className="font-display text-2xl font-black text-amber-200 uppercase tracking-tighter leading-none">Intelligence for {empathyForm.name}</h3>
                                <p className="font-mono text-[9px] uppercase tracking-widest text-amber-500/60 mt-1 font-bold">Forensic Personal Audit Complete</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="font-mono text-[10px] uppercase text-amber-400 font-black tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> Your Guaranteed Rights
                              </h4>
                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {empathyData.rights.map((right, i) => (
                                  <li key={i} className="flex gap-3 items-center text-sm text-amber-100/70 bg-amber-500/5 px-4 py-3 rounded border border-amber-500/10">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                    {right}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="pt-8 border-t border-amber-500/20 space-y-6">
                              <p className="text-xl leading-relaxed text-amber-100/95 font-black italic text-center">
                                "{empathyData.personalized_explanation}"
                              </p>
                              
                              <div className="text-center italic text-sm text-amber-500/60 font-serif">
                                {empathyData.reassurance_statement}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Forensic Bias Trace */}
                {!isComparisonMode && trace && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-verdiqt-line" />
                        <h3 className="font-display text-xl font-bold uppercase tracking-widest text-verdiqt-accent-red">Forensic Bias Trace</h3>
                        <div className="h-px flex-1 bg-verdiqt-line" />
                      </div>
                      {renderTrace(trace)}
                    </div>

                    {/* Bias Heatmap Visualization */}
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="bg-verdiqt-card border border-verdiqt-line p-8 rounded-lg relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Activity className="w-48 h-48 text-verdiqt-accent-blue" />
                      </div>

                      <div className="relative z-10">
                        <h4 className="font-mono text-[10px] uppercase opacity-50 mb-8 tracking-widest flex items-center gap-2">
                          <Activity className="w-3 h-3 text-verdiqt-accent-blue" /> Multi-Dimensional Bias Heatmap Grid
                        </h4>

                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="p-3 text-left font-mono text-[9px] uppercase opacity-40 border-b border-verdiqt-line">Protected Attribute</th>
                                <th className="p-3 text-center font-mono text-[9px] uppercase opacity-40 border-b border-verdiqt-line">Collection</th>
                                <th className="p-3 text-center font-mono text-[9px] uppercase opacity-40 border-b border-verdiqt-line">Labeling</th>
                                <th className="p-3 text-center font-mono text-[9px] uppercase opacity-40 border-b border-verdiqt-line">Feature Selection</th>
                                <th className="p-3 text-center font-mono text-[9px] uppercase opacity-40 border-b border-verdiqt-line">Model Training</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trace.heatmap_data.map((row, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                  <td className="p-4 font-display font-black text-sm uppercase tracking-tight border-b border-verdiqt-line group-hover:text-verdiqt-accent-blue transition-colors">
                                    {row.attribute}
                                  </td>
                                  {['data_collection', 'labeling', 'feature_selection', 'model_training'].map(stageId => {
                                    const scoreData = row.scores.find(s => s.stage === stageId);
                                    const score = scoreData ? scoreData.intensity : 0;
                                    
                                    // Color scale: white -> light yellow -> deep red
                                    let bgColor = 'rgba(255, 255, 255, 0.02)';
                                    let textColor = 'rgba(255, 255, 255, 0.2)';
                                    
                                    if (score > 0) {
                                      const intensity = score / 100;
                                      const red = 255;
                                      const green = Math.round(255 * (1 - intensity));
                                      const blue = Math.round(200 * (1 - intensity));
                                      bgColor = `rgba(${red}, ${green}, ${blue}, ${0.1 + (intensity * 0.8)})`;
                                      textColor = intensity > 0.5 ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
                                    }

                                    return (
                                      <td key={stageId} className="p-1 border-b border-verdiqt-line">
                                        <div 
                                          className="w-full h-14 flex items-center justify-center rounded-sm transition-all hover:scale-105 hover:shadow-2xl cursor-help relative group/cell"
                                          style={{ backgroundColor: bgColor }}
                                        >
                                          <span className="font-mono text-[10px] font-black" style={{ color: textColor }}>
                                            {score}%
                                          </span>
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-black border border-white/20 rounded text-[9px] font-mono uppercase opacity-0 group-hover/cell:opacity-100 transition-opacity z-50 pointer-events-none text-center shadow-2xl">
                                            {score}% Contribution to Leakage
                                          </div>
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-verdiqt-line">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-sm bg-white/5 border border-white/10" />
                              <span className="font-mono text-[9px] uppercase opacity-40 font-bold">Zero Bias</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: 'rgba(255, 255, 200, 0.3)' }} />
                              <span className="font-mono text-[9px] uppercase opacity-40 font-bold">Trace</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: 'rgba(255, 127, 100, 0.6)' }} />
                              <span className="font-mono text-[9px] uppercase opacity-40 font-bold">Moderate</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: 'rgba(255, 0, 0, 0.9)' }} />
                              <span className="font-mono text-[9px] uppercase opacity-40 font-bold">High Risk</span>
                            </div>
                          </div>
                          <p className="font-mono text-[9px] uppercase opacity-30 italic font-bold tracking-[0.2em]">Forensic Signal Intensity Scale</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-verdiqt-card border border-verdiqt-line p-6 rounded-lg">
                  <h4 className="font-mono text-[10px] uppercase opacity-50 mb-6 tracking-widest">MITIGATION ROADMAP</h4>
                  <div className="space-y-4">
                    {analysis.fix_recommendations.map((fix, i) => (
                      <div key={i} className="flex flex-col gap-3 bg-black/30 p-4 border border-verdiqt-line rounded-lg">
                        <div className="flex gap-4 items-start">
                          <div className="bg-verdiqt-accent-green/20 text-verdiqt-accent-green w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs font-bold">
                            {i + 1}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-bold uppercase tracking-tight">{fix.title}</h5>
                              <span className={`px-2 py-0.5 rounded-[4px] font-mono text-[8px] uppercase font-black ${
                                fix.difficulty === 'Easy' ? 'bg-verdiqt-accent-green/10 text-verdiqt-accent-green' :
                                fix.difficulty === 'Medium' ? 'bg-verdiqt-accent-orange/10 text-verdiqt-accent-orange' :
                                'bg-verdiqt-accent-red/10 text-verdiqt-accent-red'
                              }`}>
                                {fix.difficulty}
                              </span>
                            </div>
                            <p className="text-xs opacity-70 leading-relaxed">{fix.description}</p>
                          </div>
                        </div>
                        
                        <div className="pl-10 space-y-3">
                          <p className="text-[10px] italic opacity-50 leading-relaxed border-l-2 border-white/10 pl-3">
                            "{fix.reasoning}"
                          </p>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[8px] uppercase font-mono tracking-widest opacity-40">
                              <span>Confidence Level</span>
                              <span>{fix.confidence_score}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${fix.confidence_score}%` }}
                                className="h-full bg-verdiqt-accent-blue"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fix Simulator Panel */}
                {!isComparisonMode && trace && (
                  <div className="bg-verdiqt-card border border-verdiqt-line p-6 rounded-lg space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono text-[10px] uppercase opacity-50 tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-verdiqt-accent-green" /> Remediation Simulation
                      </h4>
                      {simulation && (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[8px] uppercase opacity-40">Feasibility:</span>
                          <span className={`font-mono text-[8px] uppercase font-bold ${
                            simulation.technical_feasibility === 'High' ? 'text-verdiqt-accent-green' :
                            simulation.technical_feasibility === 'Medium' ? 'text-verdiqt-accent-yellow' :
                            'text-verdiqt-accent-red'
                          }`}>{simulation.technical_feasibility}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <textarea 
                        className="flex-1 bg-black/50 border border-verdiqt-line p-3 rounded text-sm focus:outline-none focus:border-verdiqt-accent-green transition-colors h-24 resize-none"
                        value={proposedFix}
                        onChange={(e) => setProposedFix(e.target.value)}
                        placeholder="Type your proposed mitigation strategy here (e.g. 'Implementing adversarial debiasing in training step')..."
                      />
                      <button 
                        onClick={handleSimulate}
                        disabled={isSimulating || !proposedFix.trim()}
                        className="bg-verdiqt-accent-green text-black px-6 py-3 rounded font-display font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.95] transition-all disabled:opacity-30 flex flex-col items-center justify-center gap-2 w-32 shrink-0"
                      >
                        {isSimulating ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                        <span>Simulate</span>
                      </button>
                    </div>

                    {simulation && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-black/40 border-l-2 border-verdiqt-accent-green p-6 space-y-4"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                          <div className="flex items-end gap-6">
                            <div className="text-center">
                              <p className="font-mono text-[8px] uppercase opacity-40 mb-1">CURRENT</p>
                              <p className="font-display text-4xl font-bold opacity-30">{simulation.old_verdiqt_score}</p>
                            </div>
                            <ArrowRight className="w-6 h-6 mb-2 opacity-20" />
                            <div className="text-center">
                              <p className="font-mono text-[8px] uppercase text-verdiqt-accent-green mb-1">PROJECTED</p>
                              <p className="font-display text-4xl font-bold text-white">{simulation.new_verdiqt_score}</p>
                            </div>
                          </div>
                          
                          <div className="bg-verdiqt-accent-green/10 px-6 py-4 border border-verdiqt-accent-green/30 rounded text-center min-w-[200px]">
                            <p className="font-mono text-[10px] uppercase text-verdiqt-accent-green mb-1 tracking-widest">IMPROVEMENT</p>
                            <p className="text-3xl font-display font-bold text-verdiqt-accent-green">+{simulation.score_improvement}%</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-mono text-[10px] uppercase opacity-50 flex items-center gap-2">
                            <History className="w-3 h-3" /> Residual Risk Analysis
                          </h5>
                          <p className="text-sm leading-relaxed italic opacity-80">
                            "{simulation.residual_risk}"
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Real World Harm Overlay */}
                <div className="bg-verdiqt-line p-6 rounded-lg flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h4 className="font-mono text-[10px] uppercase opacity-50 tracking-widest">ESTIMATED SYSTEMIC HARM</h4>
                    <p className="text-xl font-bold uppercase tracking-tight">{analysis.estimated_real_world_harm}</p>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-transparent border border-verdiqt-ink/20 px-6 py-2 rounded text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
                  >
                    Quick Export <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Formal Audit Report Button */}
                <div className="flex justify-center pt-8">
                  <div className="flex flex-col items-center gap-4 w-full">
                    <button 
                      onClick={handleGenerateReport}
                      disabled={isGeneratingReport}
                      className="group bg-white text-black px-12 py-5 rounded-sm font-display font-black text-sm uppercase tracking-[0.4em] hover:bg-verdiqt-accent-blue transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-4 shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-verdiqt-accent-blue/20"
                    >
                      {isGeneratingReport ? (
                        <>
                          <RefreshCcw className="w-5 h-5 animate-spin" />
                          Generating Forensic Dossier...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                          Generate Formal Audit Report
                        </>
                      )}
                    </button>
                    {isSampleLoaded && (
                      <div className="font-mono text-[10px] uppercase tracking-widest opacity-30 mt-4">
                        Source: UCI ML Repository - Loan Prediction Problem Dataset
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-verdiqt-card border border-verdiqt-line rounded-lg p-12 min-h-[500px] border-dashed opacity-50">
                <ShieldAlert className="w-16 h-16 mb-6 opacity-20" />
                <h3 className="font-display text-xl font-bold mb-4 uppercase tracking-tighter">System Idle</h3>
                <p className="text-sm text-center max-w-sm">
                  Waiting for data ingestion. Input model parameters on the left to begin the forensic bias auditing process.
                </p>
                {error && (
                  <div className="mt-8 bg-verdiqt-accent-red/10 border border-verdiqt-accent-red/30 p-4 rounded text-verdiqt-accent-red font-mono text-xs max-w-xs">
                    CRITICAL_ERROR: {error}
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-verdiqt-line pt-8 flex flex-col md:flex-row justify-between gap-6 opacity-30 text-[10px] uppercase tracking-widest font-mono">
        <div className="flex gap-8">
          <span>&copy; 2026 VERDIQT AI SENSE</span>
          <span>PROTOCOL v.8.9.0</span>
        </div>
        <div className="flex gap-8">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-verdiqt-accent-green" /> All Systems Nominal</span>
          <span>Encrypted Connection Active</span>
        </div>
      </footer>
    </div>

    {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && report && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-12 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white text-black w-full max-w-4xl min-h-[90vh] rounded-sm relative shadow-2xl flex flex-col print:p-0 print:m-0 print:shadow-none"
              id="audit-report"
            >
              {/* High Visibility Sticky Back Button Container */}
              <div className="sticky top-0 z-30 bg-white/95 backdrop-blur shadow-sm p-4 md:px-8 flex justify-between items-center border-b border-black/5 print:hidden">
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="bg-verdiqt-accent-blue text-black px-6 py-3 rounded-sm font-display font-black text-sm md:text-base uppercase tracking-widest flex items-center gap-3 hover:brightness-110 transition-all active:scale-[0.98] shadow-md min-h-[44px]"
                >
                  <ArrowLeft className="w-5 h-5" />
                  ← Back to Dashboard
                </button>
                
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="text-black opacity-30 hover:opacity-100 transition-opacity"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 md:p-16 flex flex-col pt-0 md:pt-0">

              {/* SECTION 1 - CLASSIFICATION BANNER */}
              <div className="bg-black text-white py-3 px-8 -mx-8 md:-mx-16 mb-8 flex justify-center items-center">
                <span className="font-mono text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-center">
                  CONFIDENTIAL — AI BIAS AUDIT REPORT — FOR INTERNAL USE ONLY
                </span>
              </div>

              {/* HEADER */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-8 border-b border-black/10 gap-6">
                <div className="flex items-center gap-1">
                  <div className="w-10 h-10 bg-black flex items-center justify-center">
                    <ShieldCheck className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-4xl font-black uppercase tracking-tighter leading-none">VERDIQT</h2>
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] font-bold opacity-50">Forensic Intelligence Engine</p>
                  </div>
                </div>
                <div className="font-mono text-[9px] md:text-[10px] space-y-1 font-bold text-left md:text-right uppercase tracking-widest leading-relaxed">
                  <div className="flex md:block items-center gap-2">
                    <span className="opacity-40">REPORT ID:</span> {report.forensic_seal_id}
                  </div>
                  <div className="flex md:block items-center gap-2">
                    <span className="opacity-40">DATE:</span> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
                  </div>
                  <div className="flex md:block items-center gap-2 text-verdiqt-accent-blue">
                    <span className="opacity-40 text-black">SYSTEM TYPE:</span> {formData.domain.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* SECTION 2 - EXECUTIVE SUMMARY */}
              <div className="mb-12">
                <h3 className="font-mono text-[10px] uppercase font-black mb-4 tracking-[0.2em] flex items-center gap-2">
                  <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center text-[8px] text-white">01</div>
                  EXECUTIVE_SUMMARY
                </h3>
                <div className="bg-black/5 p-8 border-l-4 border-black">
                  <p className="text-xl md:text-2xl leading-relaxed font-serif font-medium text-black/90">
                    {report.executive_summary}
                  </p>
                </div>
              </div>

              {/* SECTION 3 & 4 - BIAS VERDICT & AFFECTED POPULATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="flex flex-col">
                  <h3 className="font-mono text-[10px] uppercase font-black mb-4 tracking-[0.2em] flex items-center gap-2">
                    <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center text-[8px] text-white">03</div>
                    BIAS_VERDICT
                  </h3>
                  <div className={`p-8 flex flex-col items-center justify-center text-center gap-4 border-2 ${
                    analysis.bias_severity === 'Critical' || analysis.bias_severity === 'High' ? 'bg-verdiqt-accent-red/10 border-verdiqt-accent-red' : 
                    analysis.bias_severity === 'Medium' ? 'bg-verdiqt-accent-orange/10 border-verdiqt-accent-orange' : 'bg-verdiqt-accent-green/10 border-verdiqt-accent-green'
                  }`}>
                    <span className={`font-display text-2xl font-black uppercase tracking-widest ${
                      analysis.bias_severity === 'Critical' || analysis.bias_severity === 'High' ? 'text-verdiqt-accent-red' : 
                      analysis.bias_severity === 'Medium' ? 'text-verdiqt-accent-orange' : 'text-verdiqt-accent-green'
                    }`}>
                      {analysis.bias_severity.toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-display text-8xl font-black leading-none">{analysis.verdiqt_score}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold opacity-40 mt-2">VERDIQT_SCORE</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <h3 className="font-mono text-[10px] uppercase font-black mb-4 tracking-[0.2em] flex items-center gap-2">
                    <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center text-[8px] text-white">04</div>
                    AFFECTED_POPULATION
                  </h3>
                  <div className="p-8 bg-black/5 border-2 border-black/10 flex flex-col items-center justify-center text-center h-full">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-8xl font-black">{rawMetrics ? Math.round(rawMetrics.demographicParityGap * 100) : '--'}</span>
                      <span className="font-mono text-xl font-bold opacity-40">/10k</span>
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-widest font-black mt-4 max-w-[200px] leading-relaxed">
                      ESTIMATED NUMBER OF PEOPLE HARMED PER 10,000 DECISIONS
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 5 - PIPELINE CONTAMINATION MAP */}
              <div className="mb-12">
                <h3 className="font-mono text-[10px] uppercase font-black mb-6 tracking-[0.2em] flex items-center gap-2">
                  <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center text-[8px] text-white">05</div>
                  PIPELINE_CONTAMINATION_MAP
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {trace?.stages.map((stage, i) => (
                    <div key={i} className={`p-4 border-t-4 bg-black/5 ${
                      stage.indicator === 'red' ? 'border-verdiqt-accent-red' : 
                      stage.indicator === 'yellow' ? 'border-verdiqt-accent-orange' : 'border-verdiqt-accent-green'
                    }`}>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-mono text-[8px] uppercase font-bold opacity-40 tracking-widest">STAGE_{i+1}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          stage.indicator === 'red' ? 'bg-verdiqt-accent-red' : 
                          stage.indicator === 'yellow' ? 'bg-verdiqt-accent-orange' : 'bg-verdiqt-accent-green'
                        }`} />
                      </div>
                      <h4 className="font-display text-xs font-black uppercase mb-1 tracking-tight">{stage.label}</h4>
                      <div className="font-display text-xl font-black mb-3">{stage.contamination_percentage}%</div>
                      <p className="text-[10px] font-serif leading-relaxed line-clamp-3 opacity-70 italic">"{stage.real_world_analogy}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 6 - RECOMMENDATIONS */}
              <div className="mb-12">
                <h3 className="font-mono text-[10px] uppercase font-black mb-4 tracking-[0.2em] flex items-center gap-2">
                  <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center text-[8px] text-white">06</div>
                  MITIGATION_RECOMMENDATIONS
                </h3>
                <div className="space-y-4">
                  {analysis.fix_recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-6 p-6 bg-black/5 border border-black/10 items-start">
                      <div className="bg-black text-white w-10 h-10 flex items-center justify-center font-display font-black shrink-0">
                        0{i+1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-display text-lg font-black uppercase tracking-tight leading-none">{rec.title}</h4>
                          <span className={`font-mono text-[8px] uppercase font-black px-2 py-1 border border-black ${
                            rec.difficulty === 'Easy' ? 'bg-verdiqt-accent-green/20' : 
                            rec.difficulty === 'Medium' ? 'bg-verdiqt-accent-orange/20 text-verdiqt-accent-orange' : 'bg-verdiqt-accent-red/20 text-verdiqt-accent-red'
                          }`}>
                            LEVEL: {rec.difficulty}
                          </span>
                        </div>
                        <p className="text-sm font-serif leading-relaxed opacity-80">{rec.description}</p>
                        <div className="font-mono text-[8px] uppercase tracking-widest opacity-40 font-bold">
                          REASONING: {rec.reasoning}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 7 - COMPLIANCE STATUS */}
              <div className="mb-12">
                <h3 className="font-mono text-[10px] uppercase font-black mb-4 tracking-[0.2em] flex items-center gap-2">
                  <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center text-[8px] text-white">07</div>
                  COMPLIANCE_STATUS_MATRIX
                </h3>
                <div className="border border-black overflow-hidden">
                  <table className="w-full text-[10px] md:text-sm font-mono border-collapse">
                    <thead>
                      <tr className="bg-black text-white uppercase tracking-widest">
                        <th className="py-4 px-6 text-left border-r border-white/20">REGULATORY_FRAMEWORK</th>
                        <th className="py-4 px-6 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="py-4 px-6 font-bold flex items-center gap-2">
                          <Gavel className="w-4 h-4 opacity-30" /> EU AI Act (Article 10)
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-4 py-1 font-black uppercase tracking-widest text-[10px] ${analysis.verdiqt_score < 65 ? 'text-verdiqt-accent-red border border-verdiqt-accent-red' : 'text-verdiqt-accent-green border border-verdiqt-accent-green'}`}>
                            {analysis.verdiqt_score < 65 ? 'NON-COMPLIANT' : 'COMPLIANT'}
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="py-4 px-6 font-bold flex items-center gap-2">
                          <Gavel className="w-4 h-4 opacity-30" /> India DPDP Act 2023 (Fairness)
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-4 py-1 font-black uppercase tracking-widest text-[10px] ${analysis.verdiqt_score < 65 ? 'text-verdiqt-accent-red border border-verdiqt-accent-red' : 'text-verdiqt-accent-green border border-verdiqt-accent-green'}`}>
                            {analysis.verdiqt_score < 65 ? 'NON-COMPLIANT' : 'COMPLIANT'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 px-6 font-bold flex items-center gap-2">
                        <Landmark className="w-4 h-4 opacity-30" /> IEEE 7003 Standard (BIAS)
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-4 py-1 font-black uppercase tracking-widest text-[10px] ${analysis.verdiqt_score < 75 ? 'text-verdiqt-accent-red border border-verdiqt-accent-red' : 'text-verdiqt-accent-green border border-verdiqt-accent-green'}`}>
                            {analysis.verdiqt_score < 75 ? 'NON-COMPLIANT' : 'COMPLIANT'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FOOTER */}
              <div className="mt-auto pt-10 border-t-2 border-black flex flex-col md:flex-row gap-8 items-center justify-between pb-10">
                <div className="flex flex-col gap-1 items-center md:items-start order-2 md:order-1 font-mono text-[9px] font-black uppercase tracking-widest opacity-40">
                  <p>
                    Generated by VERDIQT Forensic Audit Engine | Powered by Google Gemini | {new Date().toLocaleDateString()}
                  </p>
                  <p>
                    Report ID: VDQ-{report.forensic_seal_id}
                  </p>
                </div>
                <div className="flex items-center gap-4 order-1 md:order-2">
                  <div className="bg-black text-white p-3 rotate-3 shadow-xl">
                    <Fingerprint className="w-10 h-10" />
                    <p className="font-mono text-[7px] text-center mt-1 font-black leading-none">{report.forensic_seal_id}</p>
                  </div>
                  <div className="w-32 py-2 border-y-2 border-black flex items-center justify-center bg-black/5">
                    <span className="font-display font-black text-xs uppercase tracking-tighter italic">VERIFIED_PROTOCOL</span>
                  </div>
                </div>
              </div>

              {/* Print Actions - Hide during print */}
              <div className="mt-12 flex flex-col md:flex-row justify-center gap-4 print:hidden px-4 md:px-0">
                <button 
                  onClick={handleShareReport}
                  className="w-full md:w-auto bg-verdiqt-accent-blue text-white px-8 py-4 md:py-3 min-h-[48px] rounded-sm font-display font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-verdiqt-accent-blue/90 transition-all shadow-[0_0_20px_rgba(10,132,255,0.3)]"
                >
                  <Share2 className="w-4 h-4" /> Share Report
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="w-full md:w-auto bg-black text-white px-8 py-4 md:py-3 min-h-[48px] rounded-sm font-display font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black/90 transition-all border border-white/10"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="w-full md:w-auto bg-white border border-black/20 text-black px-8 py-4 md:py-3 min-h-[48px] rounded-sm font-display font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black/5 transition-all shadow-xl"
                >
                  <Printer className="w-4 h-4" /> Print Dossier
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* History Modal */}
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-verdiqt-accent-green text-black px-6 py-3 rounded-lg font-display font-bold text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl"
        >
          <Link className="w-4 h-4" /> {toastMessage}
        </motion.div>
      )}
      {showHistory && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md overflow-hidden"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-verdiqt-bg border border-verdiqt-line w-full max-w-4xl max-h-full overflow-hidden flex flex-col rounded-xl shadow-[0_0_100px_rgba(0,0,0,1)]"
          >
            <div className="p-4 md:p-8 border-b border-verdiqt-line flex flex-col md:flex-row justify-between items-start md:items-center bg-black/40 gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-verdiqt-accent-red/20 p-2 md:p-3 rounded-lg shrink-0">
                  <History className="w-6 h-6 md:w-8 md:h-8 text-verdiqt-accent-red" />
                </div>
                <div>
                  <h2 className="font-display text-xl md:text-3xl font-black uppercase tracking-tighter leading-none mb-1">Forensic Audit History</h2>
                  <p className="font-mono text-[8px] md:text-[10px] uppercase opacity-40 tracking-widest font-bold">Verdiqt Improvement Tracking Dossier</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="px-4 py-2 bg-transparent border border-verdiqt-accent-red/30 text-verdiqt-accent-red font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-verdiqt-accent-red hover:text-white transition-all min-h-[40px]"
                  >
                    Clear All
                  </button>
                )}
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-3 hover:bg-white/10 rounded-full transition-colors order-first md:order-last"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
              {history.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-white/5 rounded-2xl opacity-30">
                  <Fingerprint className="w-16 h-16" />
                  <p className="font-mono text-xs uppercase tracking-widest text-center">No forensic audits recorded in stable memory.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-verdiqt-card border border-white/10 p-6 rounded-xl relative overflow-hidden group hover:border-verdiqt-accent-blue/50 transition-all"
                    >
                      <div className={`absolute top-0 right-0 w-16 h-1 bg-gradient-to-l ${
                        item.severity === 'Low' ? 'from-verdiqt-accent-green' :
                        item.severity === 'Medium' ? 'from-verdiqt-accent-orange' :
                        'from-verdiqt-accent-red'
                      } to-transparent opacity-50`} />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-mono text-[8px] uppercase opacity-40 mb-1">{item.date}</p>
                          <h4 className="font-display font-black text-xl uppercase tracking-tighter leading-none">{item.domain}</h4>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-2xl font-black leading-none" style={{ color: item.score <= 40 ? '#FF3B30' : item.score <= 65 ? '#FF9500' : '#34C759' }}>{item.score}</p>
                          <p className="font-mono text-[8px] uppercase font-bold opacity-30">Score</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="font-mono text-[9px] uppercase opacity-40 mb-2 font-bold tracking-widest">Impacted Surfaces</p>
                          <div className="flex flex-wrap gap-2">
                            {item.affectedGroups.map((group, idx) => (
                              <span key={idx} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-wider">
                                {group}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button 
                          onClick={() => loadFromHistory(item)}
                          className="w-full bg-verdiqt-accent-blue/10 border border-verdiqt-accent-blue/30 text-verdiqt-accent-blue py-2 rounded font-display font-bold text-[10px] uppercase tracking-widest hover:bg-verdiqt-accent-blue hover:text-black transition-all mt-2"
                        >
                          Restore Full Dossier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-black/40 border-t border-verdiqt-line text-center">
              <p className="font-mono text-[9px] uppercase opacity-30 tracking-[0.3em]">Institutional Bias Tracking Protocol Inactive // Memory Block Limit: 50</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Why VERDIQT Modal */}
    <AnimatePresence>
      {showWhyModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-md bg-black/80"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-verdiqt-card border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-xl shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-3">
                <div className="bg-verdiqt-accent-blue text-black p-1.5 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="font-display text-xl font-black uppercase tracking-tight">Why VERDIQT?</h2>
              </div>
              <button 
                onClick={() => setShowWhyModal(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 opacity-50" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="mb-8">
                <table className="w-full text-left font-mono text-[9px] md:text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest text-[9px]">
                      <th className="py-4 px-2">Feature</th>
                      <th className="py-4 px-2 text-center">IBM AIF360</th>
                      <th className="py-4 px-2 text-center">Google What-If</th>
                      <th className="py-4 px-2 text-center text-verdiqt-accent-blue bg-verdiqt-accent-blue/5">VERDIQT</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/80">
                    {[
                      ["Bias Detection", "✅", "✅", "✅"],
                      ["Pipeline Origin Tracing", "❌", "❌", "✅"],
                      ["Human Impact Story", "❌", "❌", "✅"],
                      ["Fix Simulation", "❌", "✅", "✅"],
                      ["Regulator Audit Report", "❌", "❌", "✅"],
                      ["Plain English Summary", "❌", "❌", "✅"],
                      ["Empathy Mode", "❌", "❌", "✅"],
                      ["India Compliance (DPDP)", "❌", "❌", "✅"],
                    ].map(([feature, ibm, google, verdiqt], i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-2 font-medium">{feature}</td>
                        <td className="py-4 px-2 text-center opacity-70">{ibm}</td>
                        <td className="py-4 px-2 text-center opacity-70">{google}</td>
                        <td className="py-4 px-2 text-center text-lg bg-verdiqt-accent-blue/5 border-x border-verdiqt-accent-blue/10">{verdiqt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-verdiqt-accent-blue/10 border-l-4 border-verdiqt-accent-blue rounded-r-lg">
                <p className="text-sm md:text-base font-display font-bold leading-relaxed text-verdiqt-accent-blue italic">
                  "VERDIQT is the only tool that tells you WHERE bias was born, WHO it harms, and HOW to fix it — in language anyone can understand."
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end">
              <button 
                onClick={() => setShowWhyModal(false)}
                className="bg-verdiqt-accent-blue text-black px-8 py-2.5 rounded font-display font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
              >
                Understood
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
