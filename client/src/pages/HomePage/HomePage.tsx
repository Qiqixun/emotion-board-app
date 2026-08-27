const handleCreateRoom = async () => {
  setLoading('create');

  try {

    console.log('开始创建房间');


    // 请求后端创建房间
    const response = await emotion.createRoom();


    console.log(
      '创建房间原始返回:',
      response
    );


    /**
     * 兼容两种后端返回格式
     *
     * 格式1:
     * {
     *   roomId:"",
     *   roomCode:"",
     *   playerIndex:1
     * }
     *
     * 格式2:
     * {
     *   data:{
     *      roomId:"",
     *      roomCode:"",
     *      playerIndex:1
     *   }
     * }
     */

    const roomData =
      (response as any)?.data ??
      response;



    console.log(
      '解析后的房间数据:',
      roomData
    );



    // 检查服务器返回
    if (
      !roomData ||
      !roomData.roomId ||
      !roomData.roomCode ||
      roomData.playerIndex === undefined ||
      roomData.playerIndex === null
    ) {


      console.error(
        '服务器返回房间信息错误:',
        roomData
      );


      toast.error(
        '服务器返回房间信息错误'
      );


      return;

    }



    const roomInfo = {

      roomId: String(roomData.roomId),

      roomCode: String(roomData.roomCode),

      playerIndex:
        Number(roomData.playerIndex) as 1 | 2,

    };



    console.log(
      '保存房间信息:',
      roomInfo
    );



    // 保存房间信息
    localStorage.setItem(
      ROOM_STORAGE_KEY,
      JSON.stringify(roomInfo)
    );



    toast.success(
      '房间创建成功'
    );



    // 跳转聊天页面
    navigate('/board');



  } catch (error: any) {


    console.error(
      '创建房间失败:',
      error
    );



    if(error?.response){

      console.error(
        '服务器错误:',
        error.response.data
      );

    }



    toast.error(
      '创建房间失败，请检查服务器连接'
    );



  } finally {


    setLoading(null);


  }
};
