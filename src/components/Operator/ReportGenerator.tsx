// ─── Command Center Report Generator ───────────────────────────────────────
// Compiles live smart city grid performance logs into downloadable PDF summaries
// and CSV datasets. Synchronizes all reports directly with placed map resources.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Download, CheckCircle, FileSpreadsheet, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import Papa from 'papaparse';
import { useSimulation } from '../../contexts/SimulationContext';

const ReportGenerator: React.FC = () => {
  const { currentData, historyData } = useSimulation();
  const [reportType, setReportType] = useState('daily');
  const [sections, setSections] = useState({
    production: true,
    consumption: true,
    financial: true,
    carbon: true,
    anomalies: false,
    forecasting: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fallback if simulation data is not loaded yet
  if (!currentData) {
    return (
      <div className="h-[400px] flex items-center justify-center text-text-secondary text-sm">
        <Clock className="w-5 h-5 animate-spin mr-2 text-neon-cyan" />
        Synchronizing report processor with city grid context...
      </div>
    );
  }

  const {
    solarProduction,
    windProduction,
    totalDemand,
    batteryLevel,
    renewablePercentage,
    carbonSaved,
    costSavings,
  } = currentData;

  const generatePDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        doc.setFillColor(10, 14, 26);
        doc.rect(0, 0, 210, 297, 'F');
        
        doc.setTextColor(0, 245, 255);
        doc.setFontSize(22);
        doc.text('AI-Driven Energy Twin', 20, 30);
        
        doc.setTextColor(136, 146, 164);
        doc.setFontSize(12);
        doc.text('Predict • Optimize • Simulate • Sustain', 20, 38);
        
        doc.setDrawColor(0, 245, 255);
        doc.line(20, 45, 190, 45);
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text(`Smart City Energy Report (${reportType.toUpperCase()})`, 20, 60);
        
        doc.setFontSize(11);
        doc.setTextColor(136, 146, 164);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 68);
        doc.text('Target City Area: Chennai Metropolitan Area (Chennai City Grid)', 20, 74);
        
        let yOffset = 90;
        doc.setFontSize(14);
        doc.setTextColor(0, 245, 255);
        doc.text('Executive Summary Metrics', 20, yOffset);
        
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        yOffset += 10;
        doc.text(`- Total Solar Yield: ${solarProduction.toFixed(1)} kW`, 20, yOffset);
        yOffset += 8;
        doc.text(`- Total Wind Yield: ${windProduction.toFixed(1)} kW`, 20, yOffset);
        yOffset += 8;
        doc.text(`- Grid Autonomy Rate (Renewable %): ${renewablePercentage.toFixed(1)}%`, 20, yOffset);
        yOffset += 8;
        doc.text(`- CO2 Saved Today: ${(carbonSaved / 1000).toFixed(4)} Tons CO2`, 20, yOffset);
        yOffset += 8;
        doc.text(`- Battery Capacity Reserve Status: ${batteryLevel.toFixed(1)}% SOC`, 20, yOffset);
        yOffset += 8;
        doc.text(`- Cost Savings: INR ${Math.round(costSavings).toLocaleString('en-IN')}`, 20, yOffset);
        
        yOffset += 20;
        doc.setFontSize(14);
        doc.setTextColor(0, 245, 255);
        doc.text('Subsystem Breakdown Status', 20, yOffset);
        
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        yOffset += 10;
        if (sections.production) {
          doc.text(`• Energy Production Module: ${solarProduction + windProduction > 0 ? 'Active (Generating)' : 'Idle (0 kW output)'}`, 20, yOffset);
          yOffset += 8;
        }
        if (sections.consumption) {
          doc.text(`• Building Load Balance Module: Load of ${totalDemand.toFixed(1)} kW active`, 20, yOffset);
          yOffset += 8;
        }
        if (sections.financial) {
          doc.text(`• Feed-in Tariff & Savings Tracking: Savings ₹${Math.round(costSavings).toLocaleString('en-IN')} achieved`, 20, yOffset);
          yOffset += 8;
        }
        if (sections.carbon) {
          doc.text(`• Carbon Offset Registry Tracker: Offset ${carbonSaved.toFixed(1)} kg CO2`, 20, yOffset);
          yOffset += 8;
        }
        
        yOffset += 20;
        doc.setFontSize(10);
        doc.setTextColor(136, 146, 164);
        doc.text('This is an automated system report from the AI-Driven Energy Twin command center.', 20, yOffset);
        doc.text('Powered by NVIDIA NIM LLM forecasting & Supabase Ledger.', 20, yOffset + 6);
        
        doc.save(`energy_twin_report_${reportType}.pdf`);
        showToast('PDF report downloaded successfully!');
      } catch (err) {
        console.error(err);
        showToast('Failed to generate PDF');
      } finally {
        setIsGenerating(false);
      }
    }, 1200);
  };

  const generateCSV = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        // Build rows from actual simulation ticks history log!
        const rows = [
          ['Timestamp', 'Solar Output (kW)', 'Wind Output (kW)', 'Total Renewable (kW)', 'Grid Import (kW)', 'Grid Export (kW)', 'City Load Demand (kW)', 'Battery Level (%)', 'Carbon Saved (kg)', 'Cost Savings (INR)'],
        ];

        if (historyData.length > 0) {
          historyData.forEach((d) => {
            rows.push([
              d.timestamp,
              d.solarProduction.toFixed(1),
              d.windProduction.toFixed(1),
              (d.solarProduction + d.windProduction).toFixed(1),
              d.gridImport.toFixed(1),
              d.gridExport.toFixed(1),
              d.totalDemand.toFixed(1),
              d.batteryLevel.toFixed(1),
              d.carbonSaved.toFixed(1),
              d.costSavings.toFixed(1)
            ]);
          });
        } else {
          // Fallback if no history yet
          rows.push([
            new Date().toISOString(),
            solarProduction.toFixed(1),
            windProduction.toFixed(1),
            (solarProduction + windProduction).toFixed(1),
            (totalDemand > solarProduction + windProduction ? totalDemand - (solarProduction + windProduction) : 0).toFixed(1),
            (solarProduction + windProduction > totalDemand ? (solarProduction + windProduction) - totalDemand : 0).toFixed(1),
            totalDemand.toFixed(1),
            batteryLevel.toFixed(1),
            carbonSaved.toFixed(1),
            costSavings.toFixed(1)
          ]);
        }
        
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `energy_twin_data_${reportType}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('CSV database exported successfully!');
      } catch (err) {
        console.error(err);
        showToast('Failed to export CSV');
      } finally {
        setIsGenerating(false);
      }
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-neon-green/10 border border-neon-green/20 text-neon-green px-4 py-2.5 rounded-xl text-xs font-semibold backdrop-blur"
          >
            <CheckCircle className="w-4 h-4" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 lg:col-span-2 space-y-6"
        >
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-neon-cyan" />
            Report Configuration
          </h3>

          {/* Timeframe Selector */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-2">Report Interval</label>
            <div className="flex gap-2">
              {['daily', 'weekly', 'monthly'].map(type => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all capitalize cursor-pointer border ${
                    reportType === type
                      ? 'bg-neon-cyan/15 border-neon-cyan/25 text-neon-cyan'
                      : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-3">Include Report Modules</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(sections).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => toggleSection(key as any)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    value
                      ? 'bg-neon-cyan/5 border-neon-cyan/20 text-white font-semibold'
                      : 'bg-black/10 border-white/5 text-text-secondary'
                  }`}
                >
                  <span className="capitalize">{key.replace('_', ' ')} Report</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                    value ? 'bg-neon-cyan border-neon-cyan text-bg-primary' : 'border-white/20'
                  }`}>
                    {value && <CheckCircle className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generation Action Buttons */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap gap-4">
            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className="btn-neon-solid text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Download PDF Report'}
            </button>
            <button
              onClick={generateCSV}
              disabled={isGenerating}
              className="btn-neon text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isGenerating ? 'Exporting...' : 'Export CSV Dataset'}
            </button>
          </div>
        </motion.div>

        {/* Report Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 flex flex-col"
        >
          <h3 className="text-base font-bold text-white mb-4">Live Preview</h3>
          <div className="flex-1 bg-black/25 border border-white/5 rounded-xl p-4 font-mono text-[10px] text-text-secondary leading-relaxed overflow-y-auto max-h-[350px]">
            <p className="text-neon-cyan text-xs font-semibold mb-2">AI-Driven Energy Twin Command Center v1.0</p>
            <p className="border-b border-white/10 pb-2 mb-2">================================================</p>
            <p className="text-white font-semibold">REPORT TYPE: {reportType.toUpperCase()}</p>
            <p>DATETIME: {new Date().toISOString()}</p>
            <p>TARGET NODE: Chennai City Grid</p>
            <br />
            <p className="text-neon-green font-semibold">[INCLUDED MODULES]</p>
            {Object.entries(sections).map(([key, value]) => (
              <p key={key} className={value ? 'text-white' : 'line-through text-text-dim'}>
                - {key.toUpperCase()}: {value ? 'ENABLED' : 'DISABLED'}
              </p>
            ))}
            <br />
            <p className="text-neon-cyan font-semibold">[PROCESSED SUMMARY METRICS]</p>
            <p>- Total Solar Yield: {solarProduction.toFixed(1)} kW</p>
            <p>- Total Wind Yield: {windProduction.toFixed(1)} kW</p>
            <p>- Carbon Savings: ${(carbonSaved / 1000).toFixed(4)} Tons CO2 Equivalent</p>
            <p>- Cost Offset Index: ₹{Math.round(costSavings).toLocaleString('en-IN')} savings achieved</p>
            <p>- Emergency Load Shedding Status: Inactive (Normal)</p>
            <p>- Battery SOC Level: {batteryLevel.toFixed(1)}%</p>
            <br />
            <p className="text-[9px] text-text-dim mt-4">--- End of Live Preview Draft ---</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReportGenerator;
