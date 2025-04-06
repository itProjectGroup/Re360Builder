var APP_DATA = {
  "scenes": [
    {
      "id": "0-main1",
      "name": "main1",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 1488,
      "initialViewParameters": {
        "yaw": 0.11146461078741332,
        "pitch": 0.29210736935381654,
        "fov": 1.3401592523986738
      },
      "linkHotspots": [
        {
          "yaw": -1.6376845045559278,
          "pitch": 0.2645500411998185,
          "rotation": 6.283185307179586,
          "target": "1-laundry"
        },
        {
          "yaw": -0.044757159242838185,
          "pitch": 0.27370427461625013,
          "rotation": 0,
          "target": "2-main2"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "1-laundry",
      "name": "laundry",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 1488,
      "initialViewParameters": {
        "yaw": -0.008529889591951445,
        "pitch": 0.1501680192708328,
        "fov": 1.3401592523986738
      },
      "linkHotspots": [
        {
          "yaw": 3.1299910325906417,
          "pitch": 0.19612632608258806,
          "rotation": 0,
          "target": "0-main1"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "2-main2",
      "name": "main2",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 1488,
      "initialViewParameters": {
        "yaw": 0.05429931488826867,
        "pitch": 0.16711869765880394,
        "fov": 1.3401592523986738
      },
      "linkHotspots": [],
      "infoHotspots": []
    }
  ],
  "name": "Project Title",
  "settings": {
    "mouseViewMode": "drag",
    "autorotateEnabled": true,
    "fullscreenButton": false,
    "viewControlButtons": false
  }
};
