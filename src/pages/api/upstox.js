// // pages/api/upstox.js
import axios from 'axios';

// export default async function handler(req, res) {
//   const { symbol, interval, from, to } = req.query;

//   try {
//     const response = await axios.get(
//       `${process.env.NEXT_PUBLIC_UPSTOX_API_BASE_URL}/historical`,
//       {
//         headers: {
//           'x-api-key': process.env.NEXT_PUBLIC_UPSTOX_API_KEY,
//           'Authorization': `Bearer ${process.env.NEXT_PUBLIC_UPSTOX_API_SECRET}`,
//         },
//         params: {
//           symbol: symbol,
//           interval: interval, // e.g., '5min', '1day'
//           from: from,
//           to: to,
//         },
//       }
//     );

//     res.status(200).json(response.data);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to fetch historical data from Upstox' });
//   }
// }
import { parseISO } from 'date-fns';
import talib from 'ta-lib';
import KiteApp from "./kite";

// Helper to calculate the Moving Average
const calculateSMA = (data, windowSize) => {
  let sma = [];
  for (let i = 0; i <= data.length - windowSize; i++) {
    let sum =
      data.slice(i, i + windowSize).reduce((acc, val) => acc + val, 0) /
      windowSize;
    sma.push(sum);
  }
  return sma;
};

// Helper to calculate RSI (Relative Strength Index)
const calculateRSI = (data, period = 14) => {
  let gains = [];
  let losses = [];
  for (let i = 1; i < data.length; i++) {
    const difference = data[i] - data[i - 1];
    if (difference >= 0) {
      gains.push(difference);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(difference));
    }
  }

  const avgGain =
    gains.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
  const avgLoss =
    losses.slice(0, period).reduce((acc, val) => acc + val, 0) / period;

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  console.log(rsi, 'P{P{')

  return rsi;
};

async function fetchStockData(symbol) {
  const { instrument, interval, from, to } = symbol
  // console.log(instrument, interval, from, to, '>>>>>>>>>');
  try {
    // const enctoken = await getEnctoken('MW5717', 'Hari_!339392', '194832');
    const kite = new KiteApp(
      process.env.ENC_TOKEN
    );

    // const instruments = await kite.instruments(KiteApp.EXCHANGE_NSE);
    // console.log('=======/n', kite, '/n========');
    // console.log(kite.in)
    // return kite.positions()

    const historicalData = await kite.historicalData(
      instrument,
      from,
      to,
      interval
    );
    // console.log(historicalData, '>>>>>>>>>');
    return historicalData;
  } catch (error) {
    console.error("Error:", error.message);
  }
}
function printSignal(symbol, action, optionType, method) {
  console.log(
    `Signal from ${method} for ${symbol}: ${action} ${optionType} option`
  );
  return `Signal from ${method} for ${symbol}: ${action} ${optionType} option`
}

// async function breakoutStrategy(data) {
//   // let data = await fetchStockData(symbol);
//   // console.log(data, 'L:L:L:')

//   // console.log('*************', data, '************')

//   let prevHigh = Math.max(...data.slice(-5, -1).map((candle) => candle.high));
//   let prevLow = Math.min(...data.slice(-5, -1).map((candle) => candle.low));
//   let currentPrice = data[data.length - 1].close;
//   // console.log('currentPrice: ', currentPrice, 'prevHigh: ', prevHigh, '::', 'prevLow: ', prevLow, '::', )

//   if (currentPrice > prevHigh) {
//     printSignal("symbol", "BUY", "CALL", "breakoutStrategy");
//   } else if (currentPrice < prevLow) {
//     printSignal("symbol", "BUY", "PUT", "breakoutStrategy");
//   } else {
//     // console.log(`No breakout for ${'symbol'}`);
//   }
// }

async function breakoutStrategy(data) {
  // console.log('sdfasdf', data)
  // Calculate the previous high and low based on the last 5 candles
  let prevHigh = Math.max(...data.slice(-5, -1).map(candle => candle.high));
  let prevLow = Math.min(...data.slice(-5, -1).map(candle => candle.low));
  let currentPrice = data[data.length - 1].close;

  // Initialize result object
  let result = {
    symbol: 'symbol', // replace with actual symbol if available
    strategy: 'breakoutStrategy',
    currentPrice: currentPrice,
    prevHigh: prevHigh,
    prevLow: prevLow,
    signal: null,
    optionType: null
  };

  // Determine the signal based on breakout conditions
  if (currentPrice > prevHigh) {
    result.signal = "BUY";
    result.optionType = "CALL";
  } else if (currentPrice < prevLow) {
    result.signal = "BUY";
    result.optionType = "PUT";
  } else {
    result.signal = "NO_BREAKOUT";
  }


// console.log(result, 'result are')
  return result;
}

async function backtestStrategy(strategyFunction, symbol) {
  let data = await fetchStockData(symbol);
  let results = [];
  for (let i = 0; i < data.length; i++) {
    let signal = await strategyFunction(data.slice(0, i + 1)); // Apply strategy on historical data up to the current point
    if (signal) results.push(signal);
  }
  return results;
}

// Main handler function
export default async function handler(req, res) {
  const { instrument, interval, from, to } = req.query;
  
  if (!instrument || !interval || !from || !to) {
    return res
    .status(400)
    .json({ error: "Please provide all required query parameters" });
  }
  
  try {
    
      const breakout = await backtestStrategy(breakoutStrategy, {instrument, interval, from, to });  // Await the breakoutStrategy
      const rsi = await(backtestStrategy(calculateRSI, {instrument, interval, from, to }))
      return res.status(200).json({ analysis: {
        breakout,
        rsi,
      }})
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch or analyze data" });
  }
}
