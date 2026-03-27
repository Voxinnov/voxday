const axios = require('axios');
async function test() {
    try {
        const res = await axios.post('http://localhost:5000/api/notes', {title:'a',content:'b'}, {headers: {Authorization: 'Bearer test'}});
        console.log(res.data);
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
test();
