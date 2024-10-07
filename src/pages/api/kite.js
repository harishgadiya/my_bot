import axios from 'axios';
import { parseISO } from 'date-fns';

class KiteApp {
    // Class variables for products, order types, etc.
    static PRODUCT_MIS = "MIS";
    static PRODUCT_CNC = "CNC";
    static PRODUCT_NRML = "NRML";
    static PRODUCT_CO = "CO";

    static ORDER_TYPE_MARKET = "MARKET";
    static ORDER_TYPE_LIMIT = "LIMIT";
    static ORDER_TYPE_SLM = "SL-M";
    static ORDER_TYPE_SL = "SL";

    static VARIETY_REGULAR = "regular";
    static VARIETY_CO = "co";
    static VARIETY_AMO = "amo";

    static TRANSACTION_TYPE_BUY = "BUY";
    static TRANSACTION_TYPE_SELL = "SELL";

    static VALIDITY_DAY = "DAY";
    static VALIDITY_IOC = "IOC";

    static EXCHANGE_NSE = "NSE";
    static EXCHANGE_BSE = "BSE";
    static EXCHANGE_NFO = "NFO";
    static EXCHANGE_CDS = "CDS";
    static EXCHANGE_BFO = "BFO";
    static EXCHANGE_MCX = "MCX";

    constructor(enctoken) {
        this.enctoken = enctoken;
        this.headers = {
            'Authorization': `enctoken ${this.enctoken}`
        };
        this.session = axios.create({
            headers: this.headers
        });
        this.root_url = "https://kite.zerodha.com/oms";
    }

    async instruments(exchange = null) {
        try {
            const response = await this.session.get('https://api.kite.trade/instruments');
            const data = response.data.split("\n");
            const exchangeList = [];

            data.slice(1, -1).forEach(row => {
                const values = row.split(",");
                if (!exchange || exchange === values[11]) {
                    exchangeList.push({
                        instrument_token: parseInt(values[0]),
                        exchange_token: values[1],
                        tradingsymbol: values[2],
                        name: values[3].replace(/\"/g, ""),
                        last_price: parseFloat(values[4]),
                        expiry: values[5] ? parseISO(values[5]) : null,
                        strike: parseFloat(values[6]),
                        tick_size: parseFloat(values[7]),
                        lot_size: parseInt(values[8]),
                        instrument_type: values[9],
                        segment: values[10],
                        exchange: values[11]
                    });
                }
            });

            return exchangeList;
        } catch (error) {
            console.error('Error fetching instruments:', error.message);
        }
    }

    async historicalData(instrument_token, from_date, to_date, interval, continuous = false, oi = false) {
        try {
            const params = {
                from: from_date,
                to: to_date,
                interval: interval,
                continuous: continuous ? 1 : 0,
                oi: oi ? 1 : 0
            };

            const response = await this.session.get(`${this.root_url}/instruments/historical/${instrument_token}/${interval}`, { params });
            const candles = response.data.data.candles;

            const records = candles.map(candle => {
                const [date, open, high, low, close, volume, openInterest] = candle;
                const record = {
                    date: parseISO(date),
                    open,
                    high,
                    low,
                    close,
                    volume
                };
                if (openInterest) record.oi = openInterest;
                return record;
            });

            return records;
        } catch (error) {
            console.error('Error fetching historical data:', error.message);
        }
    }

    async margins() {
        try {
            const response = await this.session.get(`${this.root_url}/user/margins`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching margins:', error.message);
        }
    }

    async profile() {
        try {
            const response = await this.session.get(`${this.root_url}/user/profile`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching profile:', error.message);
        }
    }

    async orders() {
        try {
            const response = await this.session.get(`${this.root_url}/orders`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching orders:', error.message);
        }
    }

    async positions() {
        try {
            const response = await this.session.get(`${this.root_url}/portfolio/positions`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching positions:', error.message);
        }
    }

    async placeOrder(params) {
        try {
            const response = await this.session.post(`${this.root_url}/orders/${params.variety}`, params);
            return response.data.data.order_id;
        } catch (error) {
            console.error('Error placing order:', error.message);
        }
    }

    async modifyOrder(params) {
        try {
            const response = await this.session.put(`${this.root_url}/orders/${params.variety}/${params.order_id}`, params);
            return response.data.data.order_id;
        } catch (error) {
            console.error('Error modifying order:', error.message);
        }
    }

    async cancelOrder(variety, order_id, parent_order_id = null) {
        try {
            const response = await this.session.delete(`${this.root_url}/orders/${variety}/${order_id}`, {
                data: { parent_order_id }
            });
            return response.data.data.order_id;
        } catch (error) {
            console.error('Error canceling order:', error.message);
        }
    }
}
export default KiteApp