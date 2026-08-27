const handleCreateRoom = async () => {

  setLoading('create');

  try {

    console.log("开始创建房间");


    const res:any = await emotion.createRoom();


    console.log(
      "服务器返回:",
      JSON.stringify(res)
    );


    //兼容后端返回格式
    const roomData = res.data || res;



    if(
      !roomData.roomId ||
      !roomData.roomCode ||
      !roomData.playerIndex
    ){

      console.error(
        "房间数据错误:",
        roomData
      );


      toast.error(
        "服务器返回房间信息错误"
      );


      return;

    }



    const roomInfo = {

      roomId:
        roomData.roomId,


      roomCode:
        roomData.roomCode,


      playerIndex:
        roomData.playerIndex,


    };



    console.log(
      "保存:",
      roomInfo
    );



    localStorage.setItem(
      ROOM_STORAGE_KEY,
      JSON.stringify(roomInfo)
    );



    toast.success(
      "房间创建成功"
    );



    navigate("/board");



  }catch(error:any){


    console.error(
      "创建失败:",
      error
    );


    toast.error(
      "创建房间失败，请检查服务器"
    );


  }finally{


    setLoading(null);


  }


};
