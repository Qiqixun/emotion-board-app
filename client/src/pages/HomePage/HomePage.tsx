import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { emotion } from '@client/src/api';

const ROOM_STORAGE_KEY = 'emotion_room_info';


const HomePage: React.FC = () => {

  const navigate = useNavigate();


  const [showJoinInput, setShowJoinInput] = useState(false);

  const [joinCode, setJoinCode] = useState('');

  const [loading, setLoading] =
    useState<'create' | 'join' | null>(null);



  // 创建房间
  const handleCreateRoom = async () => {

    setLoading('create');


    try {


      console.log(
        '开始创建房间'
      );


      const response =
        await emotion.createRoom();



      console.log(
        '服务器返回:',
        response
      );



      // 兼容 axios 返回格式
      const roomData =
        (response as any)?.data ??
        response;



      console.log(
        '解析房间数据:',
        roomData
      );



      if (
        !roomData?.roomId ||
        !roomData?.roomCode ||
        roomData?.playerIndex === undefined
      ) {


        console.error(
          '房间数据错误:',
          roomData
        );


        toast.error(
          '服务器返回房间信息错误'
        );


        return;

      }



      const roomInfo = {

        roomId:
          String(roomData.roomId),


        roomCode:
          String(roomData.roomCode),


        playerIndex:
          Number(roomData.playerIndex) as 1 | 2,

      };



      localStorage.setItem(
        ROOM_STORAGE_KEY,
        JSON.stringify(roomInfo)
      );



      toast.success(
        '房间创建成功'
      );


      navigate('/board');



    } catch(error){


      console.error(
        '创建房间失败:',
        error
      );


      toast.error(
        '创建房间失败，请检查服务器'
      );



    } finally {


      setLoading(null);


    }


  };




  // 加入房间
  const handleJoinRoom = async () => {


    if(!/^\d{6}$/.test(joinCode)){


      toast.error(
        '请输入6位数字房间码'
      );


      return;

    }



    setLoading('join');



    try{


      const response =
        await emotion.joinRoom(joinCode);



      const roomData =
        (response as any)?.data ??
        response;



      const roomInfo = {


        roomId:
          String(roomData.roomId),


        roomCode:
          String(roomData.roomCode),


        playerIndex:
          Number(roomData.playerIndex) as 1 | 2,

      };



      localStorage.setItem(
        ROOM_STORAGE_KEY,
        JSON.stringify(roomInfo)
      );



      toast.success(
        '加入房间成功'
      );


      navigate('/board');



    }catch(error:any){


      console.error(
        error
      );


      toast.error(
        error?.response?.data?.message ||
        '加入失败'
      );


    }finally{


      setLoading(null);


    }


  };





  const handleCodeChange =
    (e:React.ChangeEvent<HTMLInputElement>)=>{


      const value =
        e.target.value
        .replace(/\D/g,'')
        .slice(0,6);



      setJoinCode(value);


    };





  return (

    <div
      className="
      min-h-screen
      w-full
      bg-gradient-to-br
      from-pink-100
      to-purple-100
      flex
      items-center
      justify-center
      p-4
      "
    >


      <div
        className="
        max-w-md
        w-full
        bg-white/80
        rounded-3xl
        shadow-lg
        p-8
        "
      >


        <div
          className="
          flex
          flex-col
          items-center
          gap-3
          "
        >


          <div className="text-5xl">
            💕
          </div>


          <h1 className="text-xl font-semibold">
            情绪看板
          </h1>


          <p className="text-sm text-gray-500">
            和TA分享此刻的心情
          </p>


        </div>




        <div
          className="
          mt-8
          flex
          flex-col
          gap-3
          "
        >


          <button

            onClick={handleCreateRoom}

            disabled={
              loading!==null
            }

            className="
            h-12
            rounded-xl
            bg-pink-500
            text-white
            font-medium
            "
          >

            {
              loading==='create'
              ?
              '创建中...'
              :
              '创建房间'
            }


          </button>




          {
            !showJoinInput ?

            <button

              onClick={()=>
                setShowJoinInput(true)
              }

              className="
              h-12
              rounded-xl
              border
              bg-white
              "
            >

              加入房间


            </button>


            :

            <div
              className="
              flex
              gap-2
              "
            >


              <input

                value={joinCode}

                onChange={handleCodeChange}

                placeholder="请输入6位房间码"

                className="
                flex-1
                border
                rounded-xl
                px-3
                "
              />



              <button

                onClick={handleJoinRoom}

                disabled={
                  joinCode.length!==6
                }

                className="
                px-4
                rounded-xl
                bg-pink-500
                text-white
                "
              >

                {
                  loading==='join'
                  ?
                  '...'
                  :
                  '加入'
                }


              </button>



            </div>

          }


        </div>



        <p
          className="
          mt-6
          text-xs
          text-gray-500
          text-center
          "
        >

          创建后分享房间码给TA，一起记录心情

        </p>



      </div>


    </div>

  );


};



export default HomePage;
