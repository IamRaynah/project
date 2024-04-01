import { useEffect, useState } from 'react'
import Chart from "react-apexcharts"
import axios, { AxiosResponse } from 'axios'

import { API_KEY } from './consts'

import './App.css'

interface dataInterface {
    name: string;
    data: number[];
}

interface metaInterface {
    symbol: string;
    lastRefreshed: string;
    timeZone: string;
}

const App = () => {
    const [info, setInfo] = useState<metaInterface | undefined>()
    const [data, setData] = useState<dataInterface[]>([])    
    const [categories, setCategories] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<any>()
    const [ops, setOps] = useState({
        open: 0,
        closing: 0,
        volume: 0
    })

    const execute = async () => {
        try {
            setLoading(true)
            const response: AxiosResponse = await axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=${API_KEY}`, {
                headers: { 'User-Agent': 'request' }
            })

            if (response.data['Information']) {
                setError({ message: response.data['Information'] })
            } else {
                let series = response.data['Time Series (5min)']
                let meta = response.data['Meta Data']
                let resp = Object.keys(series)

                setInfo({
                    symbol: meta.Symbol,
                    lastRefreshed: meta['Last Refreshed'],
                    timeZone: meta['Time Zone']
                })
                setOps({
                    open: Number(series[resp[0]]['1. open']),
                    closing: Number(series[resp[resp.length - 1]]['4. close']),
                    volume: Math.round(series.reduce((total: number, x: any) => total + Number(x['5. volume']), 0) / resp.length)
                })
                setCategories(resp)
                setData([
                    {
                    name: "open",
                    data: resp.map(rec => Number(series[rec]['1. open']))
                    },
                    {
                    name: "high",
                    data: resp.map(rec => Number(series[rec]['2. high']))
                    },
                    {
                    name: "low",
                    data: resp.map(rec => Number(series[rec]['3. low']))
                    },
                    {
                    name: "close",
                    data: resp.map(rec => Number(series[rec]['4. close']))
                    }
                ])
            }
            setLoading(false)
        } catch (error) {
            setError(error)
            setLoading(false)
        }
    }

    useEffect(() => {
        execute()
    }, [])

    let options = {
        chart: {
            id: "basic-bar"
        },
        xaxis: {
            categories
        }
    }

    const clearError = () => setError(null)

    const retry = () => {
        clearError()
        execute()
    }

    return (

        <div className="w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-6">
            {
                error &&
                <div className="grid min-h-[140px] w-full place-items-center overflow-x-scroll rounded-lg p-6 lg:overflow-visible">
                    <div role="alert" className="relative block w-full text-base font-regular px-4 py-4 rounded-lg bg-red-500 text-white flex">
                        <div className=" mr-12">
                            <p className="font-bold text-white">
                                { error.message }
                                <span onClick={ retry } title="" className="inline-flex items-center justify-center text-sm font-bold text-yellow-300 transition-all ml-4 duration-200 rounded-md hover:text-gray-700" role="button">
                                    Retry
                                </span>
                            </p>
                        </div>
                        <button onClick={ clearError } className="relative align-middle select-none font-sans font-medium text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none w-8 max-w-[32px] h-8 max-h-[32px] rounded-lg text-xs text-white hover:bg-white/10 active:bg-white/30 !absolute top-3 right-3" type="button">
                            <span className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </span>
                        </button>
                    </div>
                </div>
            }
            <div className="flex justify-between">
                <div className="flex text-left">
                    <div>
                        <p className="text-base font-normal text-gray-500 dark:text-gray-400">Open</p>
                        <h5 className="leading-none text-3xl font-bold text-gray-900 dark:text-white pb-2">{ ops?.open }</h5>
                    </div>
                    <div className="ml-6">
                        <p className="text-base font-normal text-gray-500 dark:text-gray-400">Closing</p>
                        <h5 className="leading-none text-3xl font-bold text-gray-900 dark:text-white pb-2">{ ops?.closing }</h5>
                    </div>
                    <div className="ml-6">
                        <p className="text-base font-normal text-gray-500 dark:text-gray-400">Volume</p>
                        <h5 className="leading-none text-3xl font-bold text-gray-900 dark:text-white pb-2">{ ops?.volume }</h5>
                    </div>
                </div>
                <div className="flex items-center px-2.5 py-0.5 text-base font-semibold text-green-500 dark:text-green-500 text-center">
                    <p className="text-base font-normal text-gray-500 dark:text-gray-400">{ info?.symbol }</p>
                    <h5 className="leading-none text-3xl font-bold text-gray-900 dark:text-white pb-2">{ info?.lastRefreshed }({ info?.timeZone })</h5>
                </div>
            </div>
            <Chart
                options={ options }
                series={ data }
                type="line"
                width="1000" />
        </div>

    )
}

export default App
