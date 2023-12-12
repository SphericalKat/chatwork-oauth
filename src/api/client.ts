import axios from 'axios';

const client = axios.create()

// client.interceptors.request.use((config) => {
// 	if (token) {
// 		config.headers.Authorization = `Bearer ${token}`
// 	}
// 	return config
// })