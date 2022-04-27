```jsx
const array = [
  {
    id: 1,
    name: '小红',
    address: '黑龙江',
    phonenumber: '1234',
  },
  {
    id: 2,
    name: '小黄',
    address: '北京',
    phonenumber: '56789',
  },
  {
    id: 3,
    name: '小绿',
    address: '广东',
    phonenumber: '34532243',
  },
  {
    id: 4,
    name: '小黑',
    address: '江西',
    phonenumber: '123432',
  },
  {
    id: 5,
    name: '小橙',
    address: '上海',
    phonenumber: '2432431241',
  },
  {
    id: 6,
    name: '小白',
    address: '湖南',
    phonenumber: '23432432142',
  },
  {
    id: 7,
    name: '小青',
    address: '广西',
    phonenumber: '2432142',
  },
];

<Table
  array={array}
  headers={['ID', '姓名', '地址', '电话号码']}
  rowRenderer={(row) => [row.id, row.name, row.address, row.phonenumber]}
/>;
```
