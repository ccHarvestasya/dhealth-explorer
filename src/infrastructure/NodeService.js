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

import http from './http';
import Constants from '../config/constants';
import * as symbol from 'symbol-sdk';
import Axios from 'axios';

class NodeService {
    /**
     * Get Storage Info from symbol SDK
     * @returns StorageInfo
     */
    static getStorageInfo = () => {
    	return http.createRepositoryFactory.createNodeRepository()
    		.getStorageInfo()
    		.toPromise();
    }

    /**
     * Get Node Info from symbol SDK
     * @returns NodeInfo
     */
    static getNodeInfo = () => {
    	return http.createRepositoryFactory.createNodeRepository()
    		.getNodeInfo()
    		.toPromise();
    }

    /**
     * Get Server Info from symbol SDK
     * @returns ServerInfo
     */
    static getServerInfo = () => {
    	return http.node.getServerInfo().toPromise();
    }

    /**
     * Get Node Peers from symbol SDK
     * @returns NodeInfo[]
     */
    static getNodePeers = async () => {
    	const nodePeers1 = await http.createRepositoryFactory.createNodeRepository()
    		.getNodePeers()
        	.toPromise();
        console.log(nodePeers1)
        const nodePeers = (await Axios.get(globalConfig.endpoints.statisticsService + 'nodes')).data;

    	const formattedNodePeers = nodePeers.map(nodeInfo => this.formatNodeInfo(nodeInfo));

    	return formattedNodePeers;
    }

    /**
     * Get node health status by endpoint.
     * @param string api-node endpoint such as http:localhost:3000
     * @returns boolean
     */
    static isNodeActive = async (currentUrl) => {
    	let status = true;

    	try {
    		await new symbol.NodeHttp(currentUrl).getNodeHealth()
    			.toPromise();
    	}
    	catch (e) {
    		status = false;
    	}

    	return status;
    }

    /**
     * Format NodoInfoDTO to readable NodoInfo object
     * @param NodoInfoDTO
     * @returns Object readable NodeInfo object
     */
    static formatNodeInfo = nodeInfo => ({
        ...nodeInfo,
        nodePublicKey: nodeInfo.publicKey,
    	address: symbol.Address.createFromPublicKey(nodeInfo.publicKey, nodeInfo.networkIdentifier).plain(),
        rolesRaw: nodeInfo.roles,
        roles: Constants.RoleType[nodeInfo.roles],
        network: Constants.NetworkType[nodeInfo.networkIdentifier],
        apiEndpoint: 
            nodeInfo.roles === 2 ||
            nodeInfo.roles === 3 ||
            nodeInfo.roles === 6 ||
            nodeInfo.roles === 7 
            ? 'http://' + nodeInfo.host + ':' + globalConfig.apiNodePort
            : Constants.Message.UNAVAILABLE
    })

    /**
     * Format Node Peers dataset into Vue Component
     * @returns Node peers object for Vue component
     */
    static getNodePeerList = async (filter) => {
    	let nodePeers = await this.getNodePeers();

    	return { 
            data: 
                nodePeers
                    .filter(el => filter.rolesRaw === null || el.rolesRaw === filter.rolesRaw)
                    .map((el, index) => ({
                        index: index + 1,
                        ...el
            }))
        };
    }


    static getNodeInfo = async (publicKey) => {
        const node = (await Axios.get(globalConfig.endpoints.statisticsService + 'nodes/' + publicKey)).data;

        const formattedNodePeers = this.formatNodeInfo(node);
        if(formattedNodePeers.rolesRaw === 2 ||
            formattedNodePeers.rolesRaw === 3 ||
            formattedNodePeers.rolesRaw === 6 ||
            formattedNodePeers.rolesRaw === 7
        ) {
            const status = await this.getNodeStatus(formattedNodePeers.apiEndpoint);
            formattedNodePeers.status = status;

            const chainInfo = await this.getNodeChainInfo(formattedNodePeers.apiEndpoint);
        }
        
    	return formattedNodePeers;
    }

    static getNodeStatus = async (nodeUrl) => {
        const status = {
            connectionStatus: false,
            databaseStatus: Constants.Message.UNAVAILABLE,
            apiNodeStatus: Constants.Message.UNAVAILABLE,
        };

        try {
            const nodeStatus = (await Axios.get(nodeUrl + '/node/health')).data.status;
            status.connectionStatus = true;
            status.apiNodeStatus = nodeStatus.apiNode === 'up';
            status.databaseStatus = nodeStatus.db === 'up';
        }
        catch(e) { console.error('Failed to get node status', e)};

        return status;
    }

    static getNodeChainInfo = async (nodeUrl) => {
        const status = {
            connectionStatus: false,
            databaseStatus: Constants.Message.UNAVAILABLE,
            apiNodeStatus: Constants.Message.UNAVAILABLE,
        };

        try {
            const nodeStatus = (await Axios.get(nodeUrl + '/node/health')).data.status;
            status.connectionStatus = true;
            status.apiNodeStatus = nodeStatus.apiNode === 'up';
            status.databaseStatus = nodeStatus.db === 'up';
        }
        catch(e) { console.error('Failed to get node status', e)};

        return status;
    }
}

export default NodeService;
