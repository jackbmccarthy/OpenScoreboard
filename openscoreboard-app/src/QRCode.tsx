// import { NativeBaseProvider, Text, View } from 'native-base';
// import React, { useEffect } from 'react';
// import { Dimensions } from 'react-native';
// import QRCode from 'react-native-qrcode-svg';
// import logoPNG from '../assets/logo.png'

// export default function QRCodeScreen(props){
//   console.log(props)
// useEffect(()=>{
//   props.navigation.setOptions({title:`${props.route.params.tableName} - Scoring URL`})
// }, [])
//   console.log(props)
//   return (
//     <NativeBaseProvider>
//       <View justifyContent={"center"} alignItems={"center"}>
        
//         <View padding={1}>
//           <Text textAlign={"center"} fontSize={"4xl"} >{props.route.params.tableName}</Text>
//         </View>
//         <View padding={1}>
//           <QRCode
//       logo={logoPNG}
//       size={Dimensions.get("screen").width > 400 ? 400 : Dimensions.get("screen").width-50 }
//       value={props.route.params.url}
//     />
//         </View>
//   <View padding={1}>
//           <Text textAlign={"center"} fontSize={"2xl"} >Please scan this URL to keep score for this table.</Text>
//         </View>
//       </View>
    
//     </NativeBaseProvider>
    
//   );
// }
// Simple usage, defaults for all but the value
