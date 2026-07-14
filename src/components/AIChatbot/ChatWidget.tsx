// ─── AI Energy Twin Chatbot Widget with Voice Support ──────────────────────────
// Floating AI Chat Widget using NVIDIA NIM endpoints. Includes Speech-to-Text
// (via browser SpeechRecognition API) and Text-to-Speech (via SpeechSynthesis API)
// for an interactive voice chat experience.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Zap,
  Loader2,
  Mic,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useSimulation } from '../../contexts/SimulationContext';
import type { SimulationData } from '../../engine/SimulationEngine';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'How much energy are we producing right now?',
  'Will we have enough power tonight?',
  'What happens if tomorrow rains?',
  'How much carbon did we save this month?',
  'Which building consumes the most energy?',
  'What is the current renewable percentage?',
  'Should I charge my EV now or wait?',
  'How can I reduce my electricity bill?',
];

// Browser speech recognition interface setup
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
}

// Helper to construct dynamic system prompt based on real-time data
function getDynamicSystemPrompt(data: SimulationData | null, assetsCount: number) {
  if (!data) return '';

  const {
    solarProduction,
    windProduction,
    totalDemand,
    batteryLevel,
    renewablePercentage,
    gridImport,
    gridExport,
    carbonSaved,
    costSavings,
    temperature,
    cloudCover,
    windSpeed,
    rainProbability,
  } = data;

  return `You are the AI-Driven Energy Twin Assistant — an advanced AI for a Smart City Renewable Energy Management Platform in Chennai, India.

You have access to the following LIVE dashboard data:
- Active Deployed Assets Count on Map: ${assetsCount} resources
- Solar Production: ${solarProduction.toFixed(1)} kW
- Wind Production: ${windProduction.toFixed(1)} kW
- Total demand: ${totalDemand.toFixed(1)} kW
- Battery SOC Level: ${batteryLevel.toFixed(1)}%
- Renewable Share Percentage: ${renewablePercentage.toFixed(1)}%
- Grid Import: ${gridImport.toFixed(1)} kW
- Grid Export: ${gridExport.toFixed(1)} kW
- Carbon Saved (CO₂): ${(carbonSaved / 1000).toFixed(4)} tons (or ${carbonSaved.toFixed(1)} kg)
- Cost Savings: ₹${costSavings.toLocaleString('en-IN')}
- Temperature: ${temperature.toFixed(1)}°C
- Cloud Cover: ${cloudCover.toFixed(1)}%
- Wind Speed: ${(windSpeed * 3.6).toFixed(1)} km/h
- Rain Probability: ${rainProbability.toFixed(1)}%
- Electricity Price: ₹8.50/kWh (standard rate), buyback rate: ₹3.50/kWh

Note: The city data and metrics are based ONLY on the resources actively placed by the user on the Live Energy Map. If there are 0 assets, tell the user that they must deploy resources (solar panels, wind turbines, building zones, batteries, etc.) to generate data and analysis.

You help both citizens and city energy operators with:
- Energy insights and forecasting
- Carbon footprint analysis
- Solar/EV recommendations
- Cost optimization
- Emergency planning
- Grid stability advice

Be concise, data-driven, and use specific numbers. Format responses with clear sections using markdown. Use ₹ for currency (Indian Rupees). Always be helpful and proactive with recommendations.`;
}

// Fallback demo response builder using live context values
function generateDynamicDemoResponse(question: string, data: SimulationData | null, assetsCount: number): string {
  const q = question.toLowerCase();
  
  if (!data || assetsCount === 0) {
    return `## Real-time Twin Diagnostic ⚠️\n\nThere are currently **0 active assets** deployed on the Live Energy Map. Consequently, total city production and demand are at **0 kW**.\n\n💡 *Action: Go to the "Live Energy Map" tab and use Quick Setup or drag-and-drop to deploy solar panels, wind turbines, and buildings to see real-time data calculations.*`;
  }

  const {
    solarProduction,
    windProduction,
    totalDemand,
    batteryLevel,
    renewablePercentage,
    gridImport,
    carbonSaved,
    costSavings,
    temperature,
  } = data;

  if (q.includes('producing') || q.includes('production') || q.includes('generating') || q.includes('energy')) {
    return `## Current Energy Production 🔋\n\n| Source | Production | Capacity | Utilization |\n|--------|-----------|----------|-------------|\n| ☀️ Solar | ${solarProduction.toFixed(1)} kW | - | - |\n| 🌬️ Wind | ${windProduction.toFixed(1)} kW | - | - |\n| **Total** | **${(solarProduction + windProduction).toFixed(1)} kW** | - | - |\n\n**Current Demand:** ${totalDemand.toFixed(1)} kW\n**Grid Import:** ${gridImport.toFixed(1)} kW\n**Renewable Share:** ${renewablePercentage.toFixed(1)}%\n\n💡 *Based on the ${assetsCount} active assets deployed on the map.*`;
  }

  if (q.includes('tonight') || q.includes('enough power') || q.includes('night')) {
    return `## Tonight's Energy Forecast 🌙\n\n**Prediction:** Based on active load: **${totalDemand.toFixed(1)} kW**.\n\n- 🔋 Battery reserves: ${batteryLevel.toFixed(1)}% SOC\n- 🌬️ Wind forecast: ${windProduction.toFixed(1)} kW\n\n**Assessment:** ${batteryLevel > 20 || windProduction > totalDemand ? '✅ Sufficient power available' : '⚠️ Low reserves, potential grid import required'}\n\n💡 *Deploy more Battery Storage or Wind Turbines to increase off-peak resilience.*`;
  }

  if (q.includes('carbon') || q.includes('co2') || q.includes('emission') || q.includes('save')) {
    return `## Carbon Savings Report 🌿\n\n**This Month's Impact:**\n- 🌱 CO₂ Saved: **${(carbonSaved / 1000).toFixed(4)} tons** (${carbonSaved.toFixed(1)} kg)\n- 🌳 Equivalent to: ${Math.round(carbonSaved / 22)} trees planted\n\n**Total active clean energy:** ${(solarProduction + windProduction).toFixed(1)} kW generated from your map assets.\n\n💡 *Deploying additional solar and wind assets directly increases this carbon savings factor.*`;
  }

  if (q.includes('building') || q.includes('consumes') || q.includes('consumption')) {
    return `## Building Energy Consumption 🏢\n\n**Total Placed Assets:** ${assetsCount} active resources\n- Total Load: **${totalDemand.toFixed(1)} kW**\n- Temperature: **${temperature.toFixed(1)}°C**\n\n💡 *Deploying commercial or residential buildings increases the load. Add Solar to match their demands.*`;
  }

  if (q.includes('bill') || q.includes('reduce') || q.includes('save') || q.includes('cost')) {
    return `## Cost Reduction Tips 💰\n\n**Estimated Monthly Savings: ₹${Math.round(costSavings * 30).toLocaleString('en-IN')}**\n\n**Top 3 Ways to Reduce:**\n1. 🔋 **Deploy Battery Storage** — Shift solar output to peak evening slots\n2. 🌬️ **Deploy Wind Turbines** — Take advantage of night wind generation\n3. ☀️ **Deploy Rooftop Solar** — Reduce active building demands during daylight`;
  }

  return `## Energy Twin AI Assistant 🤖\n\nCurrently, there are **${assetsCount} active resources** deployed on the map.\n\n- Total Production: **${(solarProduction + windProduction).toFixed(1)} kW**\n- Total Demand: **${totalDemand.toFixed(1)} kW**\n- Battery Level: **${batteryLevel.toFixed(1)}%**\n- Renewable share: **${renewablePercentage.toFixed(1)}%**\n\nHow else can I assist you with your smart city Twin simulation?`;
}

async function callNvidiaAI(
  messages: { role: string; content: string }[],
  model: string,
  systemPrompt: string,
  currentData: SimulationData | null,
  assetsCount: number
): Promise<string> {
  try {
    const backendUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/chat`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';
  } catch (error) {
    console.error('NVIDIA NIM API error:', error);
    return generateDynamicDemoResponse(messages[messages.length - 1].content, currentData, assetsCount);
  }
}

const ChatWidget: React.FC = () => {
  const { currentData, placedAssets, setPlacedAssets } = useSimulation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Welcome to the **AI-Driven Energy Twin** Assistant!\n\nI\'m powered by NVIDIA NIM AI and have access to real-time city energy data. How can I help you today?\n\nTry asking:\n- "How much energy are we producing?"\n- "Will we have enough power tonight?"\n- "How can I reduce my electricity bill?"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedModel, setSelectedModel] = useState('meta/llama-3.1-8b-instruct');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up speech synthesis on widget collapse
  useEffect(() => {
    if (!isOpen && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [isOpen]);

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // cancel any active speech

    // Strip markdown chars before passing to synthesis engine
    const cleanText = text
      .replace(/##/g, '')
      .replace(/\*\*/g, '')
      .replace(/\|/g, ' ')
      .replace(/- /g, ' ')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find(
        v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
      ) || voices.find(v => v.lang.startsWith('en'));
      
      if (preferredVoice) utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          sendMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const query = text.trim();
    const qLower = query.toLowerCase();

    const matchesIdentifyVoiceCommand = 
      qLower.includes('identify') && 
      (qLower.includes('india') || qLower.includes('tamilnadu') || qLower.includes('tamil nadu')) &&
      (qLower.includes('solar') || qLower.includes('wind') || qLower.includes('mill') || qLower.includes('turbine'));

    const matchesAnalyseLocationsCommand =
      qLower.includes('analyse') &&
      (qLower.includes('india') || qLower.includes('tamilnadu') || qLower.includes('tamil nadu')) &&
      (qLower.includes('add solar') || qLower.includes('solar panel') || qLower.includes('solar panels'));

    if (matchesIdentifyVoiceCommand || matchesAnalyseLocationsCommand) {
      // 1. Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: query,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      // 2. Simulate AI speech synthesis and map loading ticks
      setTimeout(() => {
        const kamuthi = { lat: 9.3486, lon: 78.3847, name: 'Kamuthi Solar Park (TN)' };
        const bhadla = { lat: 27.5386, lon: 71.9168, name: 'Bhadla Solar Park (RJ)' };
        const pavagada = { lat: 14.2562, lon: 77.4419, name: 'Pavagada Solar Park (KA)' };
        const muppandal = { lat: 8.2587, lon: 77.5501, name: 'Muppandal Wind Farm (TN)' };

        // Deployed solar arrays
        const newSolarKamuthi = {
          id: `solar-kamuthi-${Date.now()}`,
          type: 'solar' as const,
          name: kamuthi.name,
          lon: kamuthi.lon,
          lat: kamuthi.lat,
          emoji: '☀️',
          color: '#ffd700',
          hologramColor: '#ffd700',
          placedBy: 'government' as const,
          liveData: {
            production: 2500.0,
            consumption: 0.0,
            status: 'online' as const,
            efficiency: 98.4,
            uptime: 99.9,
          },
          timestamp: Date.now(),
        };

        const newSolarBhadla = {
          id: `solar-bhadla-${Date.now()}`,
          type: 'solar' as const,
          name: bhadla.name,
          lon: bhadla.lon,
          lat: bhadla.lat,
          emoji: '☀️',
          color: '#ffd700',
          hologramColor: '#ffd700',
          placedBy: 'government' as const,
          liveData: {
            production: 5000.0,
            consumption: 0.0,
            status: 'online' as const,
            efficiency: 99.1,
            uptime: 99.8,
          },
          timestamp: Date.now() + 1,
        };

        const newSolarPavagada = {
          id: `solar-pavagada-${Date.now()}`,
          type: 'solar' as const,
          name: pavagada.name,
          lon: pavagada.lon,
          lat: pavagada.lat,
          emoji: '☀️',
          color: '#ffd700',
          hologramColor: '#ffd700',
          placedBy: 'government' as const,
          liveData: {
            production: 3500.0,
            consumption: 0.0,
            status: 'online' as const,
            efficiency: 97.8,
            uptime: 99.7,
          },
          timestamp: Date.now() + 2,
        };

        const newWindAsset = {
          id: `wind-tamilnadu-${Date.now()}`,
          type: 'wind' as const,
          name: muppandal.name,
          lon: muppandal.lon,
          lat: muppandal.lat,
          emoji: '🌬️',
          color: '#00f5ff',
          hologramColor: '#00e5ff',
          placedBy: 'government' as const,
          liveData: {
            production: 3000.0,
            consumption: 0.0,
            status: 'online' as const,
            efficiency: 92.5,
            uptime: 99.5,
          },
          timestamp: Date.now() + 3,
        };

        // Determine assets to add based on user's query intent
        let assetsToAdd = [];
        let responseText = '';

        if (matchesAnalyseLocationsCommand) {
          // Add all three solar parks
          assetsToAdd = [newSolarKamuthi, newSolarBhadla, newSolarPavagada];
          responseText = `### ☀️ Solar Infrastructure Analysis & Deployment\n\nI have successfully identified key green hubs in India & Tamil Nadu, and deployed new utility-scale solar arrays on the Live Energy Twin Map:\n- ☀️ **Kamuthi Solar Park** (9.3486° N, 78.3847° E): Deployed a **2,500 kW Solar Array**.\n- ☀️ **Bhadla Solar Park** (27.5386° N, 71.9168° E): Deployed a **5,000 kW Solar Array**.\n- ☀️ **Pavagada Solar Park** (14.2562° N, 77.4419° E): Deployed a **3,500 kW Solar Array**.\n\nAll three hologram markers have been active-linked and initialized online! The map view has navigated to the Kamuthi Solar Park location in Tamil Nadu.`;
        } else {
          // Original fallback: solar & wind in TN
          assetsToAdd = [newSolarKamuthi, newWindAsset];
          responseText = `### Clean Energy Assets Deployed in Tamil Nadu 🌿\n\nI have successfully identified key green hubs in Tamil Nadu:\n- ☀️ **Kamuthi Solar Park** (9.3486° N, 78.3847° E): Deployed a **2,500 kW Solar Array**.\n- 🌬️ **Muppandal Wind Farm** (8.2587° N, 77.5501° E): Deployed a **3,000 kW Wind Turbine**.\n\nBoth hologram markers have been active-linked and your map view has navigated directly to the Kamuthi Solar Park location in Tamil Nadu!`;
        }

        // Append to placedAssets context state
        setPlacedAssets(prev => [...prev, ...assetsToAdd]);

        // 4. Switch operator dashboard to the "Live Energy Map" tab
        window.dispatchEvent(new CustomEvent('change-operator-tab', { detail: { tab: 'energy-map' } }));

        // 5. Trigger flight event inside Cesium viewer to fly directly to Kamuthi Solar Park coordinates
        window.dispatchEvent(new CustomEvent('fly-to-coordinates', {
          detail: { lon: kamuthi.lon, lat: kamuthi.lat, zoom: 15000, pitch: -30 }
        }));

        // 6. Speak responses back
        const assistantMessage: Message = {
          id: (Date.now() + 4).toString(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);

        if (!isMuted) {
          speakText(responseText);
        }
      }, 1200);

      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      chatHistory.push({ role: 'user', content: text.trim() });

      const systemPrompt = getDynamicSystemPrompt(currentData, placedAssets.length);
      const response = await callNvidiaAI(chatHistory, selectedModel, systemPrompt, currentData, placedAssets.length);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-read response aloud if voice chat is unmuted
      if (!isMuted) {
        speakText(response);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('## ')) {
          return <h3 key={i} className="text-lg font-bold text-neon-cyan mt-3 mb-2">{trimmed.replace('## ', '')}</h3>;
        }
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return <p key={i} className="font-semibold text-white my-1">{trimmed.replace(/\*\*/g, '')}</p>;
        }
        if (trimmed.startsWith('|')) {
          const cells = trimmed.split('|').map(c => c.trim()).filter((c, idx, arr) => {
            if (idx === 0 && c === '') return false;
            if (idx === arr.length - 1 && c === '') return false;
            return true;
          });
          
          if (cells.length === 0 || cells.every(c => c.match(/^[-:|]+$/))) return null;
          
          return (
            <div key={i} className="flex gap-2 text-xs py-1 border-b border-white/5 bg-white/[0.01] px-2">
              {cells.map((cell, j) => (
                <span key={j} className={`flex-1 ${j === 0 ? 'text-text-secondary font-semibold' : 'text-white'}`}>
                  {cell.replace(/\*\*/g, '')}
                </span>
              ))}
            </div>
          );
        }
        if (trimmed.startsWith('- ')) {
          return (
            <li key={i} className="text-xs text-text-secondary list-disc ml-4 my-0.5">
              {trimmed.replace('- ', '').replace(/\*\*/g, '')}
            </li>
          );
        }
        return <p key={i} className="text-xs text-text-secondary my-1">{line}</p>;
      });
  };

  return (
    <>
      {/* Floating Voice Access Trigger Button */}
      <motion.button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => {
            startListening();
          }, 200);
        }}
        title="Voice Chat with Energy Twin"
        className="fixed bottom-4 right-20 z-50 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-2xl bg-gradient-to-r from-neon-purple to-neon-pink text-white border border-neon-purple/30"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <Mic className="w-6 h-6 text-white animate-pulse" />
      </motion.button>

      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-2xl bg-gradient-to-r from-neon-cyan to-neon-purple text-bg-primary"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare className="w-6 h-6 text-bg-primary" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-20 right-4 z-50 w-96 h-[500px] flex flex-col rounded-2xl border border-white/10 bg-bg-primary/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-bg-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Energy Twin AI</h3>
                  <p className="text-[10px] text-text-secondary uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>
                    Powered by NVIDIA NIM
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* Voice Chat Mute/Unmute Toggle */}
                <button
                  onClick={() => {
                    const newMuted = !isMuted;
                    setIsMuted(newMuted);
                    if (newMuted && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  title={isMuted ? "Enable AI voice speech responses" : "Mute AI voice speech responses"}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer border ${
                    isMuted 
                      ? 'text-text-secondary hover:text-white border-transparent' 
                      : 'text-neon-cyan border-neon-cyan/25 bg-neon-cyan/5 hover:bg-neon-cyan/10'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div className="px-4 py-2 border-b border-white/5 bg-white/[0.01] flex items-center justify-between gap-2">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">NVIDIA NIM Model:</span>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="bg-bg-primary border border-white/10 text-white text-[10px] rounded px-2 py-0.5 outline-none focus:border-neon-cyan transition-colors"
              >
                <option value="meta/llama-3.1-8b-instruct">Llama 3.1 8B</option>
                <option value="meta/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                <option value="nvidia/llama-3.1-nemotron-70b-instruct">Nemotron 70B</option>
                <option value="mistralai/mixtral-8x22b-instruct-v0.1">Mixtral 8x22B</option>
              </select>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
              
              {/* Listening Overlay Soundwave HUD */}
              {isListening && (
                <div className="absolute inset-0 bg-bg-primary/95 backdrop-blur-md flex flex-col items-center justify-center z-40 gap-4">
                  <div className="flex gap-1 items-center h-16">
                    <span className="w-1.5 h-6 bg-neon-cyan rounded-full animate-[pulse_0.5s_infinite_alternate]" />
                    <span className="w-1.5 h-12 bg-neon-purple rounded-full animate-[pulse_0.4s_infinite_alternate_0.1s]" />
                    <span className="w-1.5 h-16 bg-neon-cyan rounded-full animate-[pulse_0.6s_infinite_alternate_0.2s]" />
                    <span className="w-1.5 h-10 bg-neon-purple rounded-full animate-[pulse_0.3s_infinite_alternate_0.15s]" />
                    <span className="w-1.5 h-6 bg-neon-cyan rounded-full animate-[pulse_0.5s_infinite_alternate_0.3s]" />
                  </div>
                  <p className="text-sm font-semibold text-white animate-pulse">Listening to your voice...</p>
                  <button
                    onClick={stopListening}
                    className="mt-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-500 text-xs font-bold hover:bg-red-500/30 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-neon-purple/20' : 'bg-neon-cyan/20'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4 text-neon-purple" />
                    ) : (
                      <Bot className="w-4 h-4 text-neon-cyan" />
                    )}
                  </div>
                  <div className={`max-w-[85%] rounded-xl p-3 relative ${
                    msg.role === 'user'
                      ? 'bg-neon-purple/10 border border-neon-purple/20'
                      : 'bg-white/5 border border-white/10'
                  }`}>
                    <div className="text-sm leading-relaxed pr-6">
                      {renderMarkdown(msg.content)}
                    </div>
                    
                    {/* Speak Specific Message on demand */}
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => speakText(msg.content)}
                        title="Read message aloud"
                        className="absolute bottom-2 right-2 text-text-secondary hover:text-white p-0.5 rounded cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-neon-cyan/20">
                    <Bot className="w-4 h-4 text-neon-cyan" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
                    <span className="text-sm text-text-secondary">Analyzing energy data...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-neon-cyan/5 border border-neon-cyan/15 text-neon-cyan hover:bg-neon-cyan/10 transition-all cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                {/* Voice input mic button */}
                <button
                  onClick={startListening}
                  title="Speak to the Energy Twin"
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 hover:border-neon-cyan/30 text-text-secondary hover:text-neon-cyan hover:bg-neon-cyan/5 transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask about energy, carbon, costs..."
                  className="input-neon flex-1 text-sm"
                  disabled={isLoading}
                />
                <motion.button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-30"
                  style={{
                    background: input.trim() ? 'linear-gradient(135deg, #00f5ff, #bf00ff)' : 'rgba(255,255,255,0.05)',
                  }}
                  whileHover={input.trim() ? { scale: 1.05 } : {}}
                  whileTap={input.trim() ? { scale: 0.95 } : {}}
                >
                  <Send className="w-4 h-4 text-bg-primary" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
