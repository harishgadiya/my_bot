"use client"

import React, { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [instrument, setInstrument] = useState('287335941');
  const [interval, setInterval] = useState('30minute');
  const [from, setFrom] = useState('2024-10-01');
  const [to, setTo] = useState('2024-10-07');
  const [analysis, setAnalysis] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.get('/api/upstox', {
        params: {
          instrument,
          interval,
          from,
          to,
        },
      });

      console.log(response.data.analysis, '>>>>>>>>>>')
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error('Error fetching analysis', error);
      setAnalysis('Error fetching analysis.');
    }
  };

  return (
    <div>
      <h1>Intraday Option Analysis</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Instrument:</label>
          <input
            type="text"
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
          />
        </div>
        <div>
          <label>Interval:</label>
          <input
            type="text"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          />
        </div>
        <div>
          <label>From Date:</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label>To Date:</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button type="submit">Analyze</button>
      </form>

      {/* {analysis && <div><h2>Analysis Result:</h2><p>{analysis}</p></div>} */}
    </div>
  );
}
