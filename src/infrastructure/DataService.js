/*
 *
 * Copyright (c) 2019-present for NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License ");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import axios from 'axios'
import http from './http'

class DataService {
  /**
   * Gets cryptocurrency market price from https://min-api.cryptocompare.com/
   * @param cryptocurrency - name such as XEM, BTC
   * @returns Object of data
   */
  static getMarketPrice = (cryptocurrency) => {
    return new Promise((resolve, reject) => {
      let url = http.marketDataUrl + `data/pricemultifull?fsyms=${cryptocurrency}&tsyms=USD`
      axios
        .get(url)
        .then(res => {
          return resolve(res.data.DISPLAY)
        })
        .catch(error => {
          // reject(new Error('Fail to request XEM price.'))
          reject(new Error(error))
        })
    })
  }

  /**
   * Gets cryptocurrency historical hourly graph from https://min-api.cryptocompare.com/
   * @param cryptocurrency - name such as XEM, BTC
   * @returns Array of Data
   */
  static getHistoricalHourlyGraph = (cryptocurrency) => {
    return new Promise((resolve, reject) => {
      let url = http.marketDataUrl + `data/histohour?fsym=${cryptocurrency}&tsym=USD&limit=168`
      axios
        .get(url)
        .then(res => {
          return resolve(res.data)
        })
        .catch(error => {
          // reject(new Error('Fail to request Xem historical hourly graph.'))
          reject(new Error(error))
        })
    })
  }
  /**
   * Gets array of transactions
   * @param limit - No of transaction
   * @param transactionType - filter transctiom type
   * @param fromHash - (Optional) retrive next transactions in pagination
   * @returns Formatted tranctionDTO[]
   */
  static getTransactionsFromHashWithLimit = async (limit, transactionType, fromHash) => {
    let hash
    if (fromHash === undefined)
      hash = 'latest'
    else
      hash = fromHash

    // Get the path to the URL dependent on the config
    let path
    if (transactionType === undefined)
      path = `/transactions/from/${hash}/limit/${limit}`
    else if (transactionType === 'unconfirmed')
      path = `/transactions/unconfirmed/from/${hash}/limit/${limit}`
    else if (transactionType === 'partial')
      path = `/transactions/partial/from/${hash}/limit/${limit}`
    else {
      const array = transactionType.split('/')
      if (array.length === 1) {
        // No filter present
        path = `/transactions/from/${hash}/type/${transactionType}/limit/${limit}`
      } else {
        // We have a filter.
        path = `/transactions/from/${hash}/type/${array[0]}/filter/${array[1]}/limit/${limit}`
      }
    }

    // Make request.
    const response = await axios.get(http.nodeUrl + path)
    const transactions = response.data.map(info => dto.createTransactionFromDTO(info, http.networkType))

    let formatted = transactions.map(transaction => TransactionService.formatTransaction(transaction))

    return formatted.map(transaction => ({
      ...transaction,
      height: transaction.transactionInfo.height,
      transactionHash: transaction.transactionInfo.hash,
      type: transaction.transactionBody.type,
      recipient: transaction.transactionBody?.recipient
    }))
  }
}

export default DataService
