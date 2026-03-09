import { useState, useMemo, useRef, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════
   PRE-GENERATED ROUTE DATA (London → 43 resorts)
   ═══════════════════════════════════════════════ */

const ROUTES_CACHE = {


"london::chamonix-mont-blanc": {"routes":[
  {"id":"R1","name":"飞 Geneva，巴士直达 Chamonix","name_en":"Fly Geneva + direct shuttle","total_duration_hours":3.5,"price_tier":"budget","complexity":"simple","tags":["最快","最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS","BA"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":"easyJet Gatwick 最便宜 £30-60; SWISS/BA 从 Heathrow"},
    {"from":"Geneva Airport","to":"Chamonix","mode":"shuttle","typical_carriers":["AlpyBus","easyBus"],"duration_hours":1.5,"distance_km":88,"notes":"机场直接上车，不用进市区，AlpyBus 约 €35"}
  ]},
  {"id":"R2","name":"飞 Lyon，大巴转 Chamonix","name_en":"Fly Lyon + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW/STN","to_code":"LYS","notes":"Ryanair Stansted 常有 £20-40 特价"},
    {"from":"Lyon","to":"Chamonix","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":3,"distance_km":220,"notes":"FlixBus 约 €19-30，经 Annecy 或 Albertville"}
  ]},
  {"id":"R3","name":"飞 Turin，走 Mont Blanc 隧道","name_en":"Fly Turin + Mont Blanc Tunnel","total_duration_hours":5,"price_tier":"budget","complexity":"moderate","tags":["创意路线"],"legs":[
    {"from":"London","to":"Turin","mode":"flight","typical_carriers":["Ryanair","Wizz Air"],"duration_hours":2,"distance_km":950,"from_code":"STN/LTN","to_code":"TRN","notes":"Ryanair/Wizz 常有超低价 £15-30"},
    {"from":"Turin","to":"Courmayeur","mode":"bus","typical_carriers":["SAVDA"],"duration_hours":1.5,"distance_km":150,"notes":"SAVDA 大巴约 €12"},
    {"from":"Courmayeur","to":"Chamonix","mode":"shuttle","typical_carriers":["Mont Blanc Tunnel shuttle"],"duration_hours":0.5,"distance_km":20,"notes":"穿 Mont Blanc 隧道 11.6km，20分钟到"}
  ]},
  {"id":"R4","name":"Eurostar Snow 滑雪专线 + 转巴士","name_en":"Eurostar Snow + bus from BSM","total_duration_hours":10,"price_tier":"mid","complexity":"moderate","tags":["仅限冬季","纯火车"],"legs":[
    {"from":"London St Pancras","to":"Lille","mode":"train","typical_carriers":["Eurostar"],"duration_hours":1.5,"distance_km":340,"notes":"周六 09:01 发车，Lille 站内换乘"},
    {"from":"Lille","to":"Bourg-Saint-Maurice","mode":"train","typical_carriers":["Eurostar Snow"],"duration_hours":6,"distance_km":780,"notes":"冬季专线 Dec-Mar，经 Chambéry→Moûtiers→BSM"},
    {"from":"Bourg-Saint-Maurice","to":"Chamonix","mode":"bus","typical_carriers":["local bus"],"duration_hours":2,"distance_km":80,"notes":"⚠️ Eurostar Snow 不直达 Chamonix，需额外转车 2h"}
  ]},
  {"id":"R5","name":"全程火车 London→Paris→Chamonix","name_en":"Eurostar + TGV + Mont-Blanc Express","total_duration_hours":9.5,"price_tier":"mid","complexity":"complex","tags":["纯火车","风景最美"],"legs":[
    {"from":"London St Pancras","to":"Paris Gare du Nord","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":"提前订 £39 起"},
    {"from":"Paris Gare de Lyon","to":"Saint-Gervais","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":5.5,"distance_km":620,"notes":"需地铁换站 Gare du Nord→Gare de Lyon（30min）"},
    {"from":"Saint-Gervais","to":"Chamonix","mode":"train","typical_carriers":["Mont-Blanc Express"],"duration_hours":0.75,"distance_km":22,"notes":"窄轨火车沿 Arve 河谷爬升，风景绝美"}
  ]},
  {"id":"R6","name":"飞 Geneva，瑞士火车风景线","name_en":"Fly Geneva + Swiss rail scenic","total_duration_hours":5,"price_tier":"mid","complexity":"moderate","tags":["风景最美"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"Martigny","mode":"train","typical_carriers":["SBB/CFF"],"duration_hours":1.75,"distance_km":110,"notes":"机场地下直接上火车，瑞士火车准时舒适"},
    {"from":"Martigny","to":"Chamonix","mode":"train","typical_carriers":["Mont-Blanc Express"],"duration_hours":1.5,"distance_km":40,"notes":"跨境窄轨火车翻越 Col des Montets"}
  ]},
  {"id":"R7","name":"飞 Bergamo 廉航，穿隧道到 Chamonix","name_en":"Fly Bergamo + Mont Blanc Tunnel","total_duration_hours":7,"price_tier":"budget","complexity":"complex","tags":["需要转车多"],"legs":[
    {"from":"London","to":"Milan Bergamo","mode":"flight","typical_carriers":["Ryanair"],"duration_hours":2,"distance_km":960,"from_code":"STN","to_code":"BGY","notes":"Ryanair 常年 £15-25"},
    {"from":"Bergamo","to":"Courmayeur","mode":"bus","typical_carriers":["FlixBus","SAVDA"],"duration_hours":3.5,"distance_km":250,"notes":"经 Milan→Aosta→Courmayeur 转车"},
    {"from":"Courmayeur","to":"Chamonix","mode":"shuttle","typical_carriers":["Mont Blanc Tunnel shuttle"],"duration_hours":0.5,"distance_km":20,"notes":"穿隧道 20 分钟"}
  ]},
  {"id":"R8","name":"FlixBus 夜车直达","name_en":"FlixBus overnight","total_duration_hours":14,"price_tier":"budget","complexity":"simple","tags":["夜车省住宿","最便宜"],"legs":[
    {"from":"London Victoria","to":"Chamonix","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":14,"distance_km":900,"notes":"夜班车经 Paris/Lyon，晚上走早上到，£29-49，省一晚住宿"}
  ]}
]},

"london::val d'isère": {"routes":[
  {"id":"R1","name":"飞 Geneva，大巴直达 Val d'Isère","name_en":"Fly Geneva + direct bus","total_duration_hours":5,"price_tier":"budget","complexity":"simple","tags":["最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS","BA"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":"easyJet Gatwick 最便宜"},
    {"from":"Geneva Airport","to":"Val d'Isère","mode":"shuttle","typical_carriers":["Bens Bus","AlpyBus","Snowbus"],"duration_hours":3,"distance_km":220,"notes":"直达巴士约 €40-55，走高速经 Albertville→Moûtiers→Bourg-St-Maurice"}
  ]},
  {"id":"R2","name":"飞 Lyon，大巴到 Val d'Isère","name_en":"Fly Lyon + bus","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW/STN","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Val d'Isère","mode":"bus","typical_carriers":["Altibus","FlixBus"],"duration_hours":3.5,"distance_km":240,"notes":"Altibus 冬季直达 shuttle 约 €35-45"}
  ]},
  {"id":"R3","name":"飞 Chambéry 小机场，最短转车","name_en":"Fly Chambéry + short transfer","total_duration_hours":4.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Chambéry","mode":"flight","typical_carriers":["Jet2","BA"],"duration_hours":1.75,"distance_km":780,"from_code":"STN/LHR","to_code":"CMF","notes":"冬季包机航线，Jet2 从 Stansted，仅周六"},
    {"from":"Chambéry Airport","to":"Val d'Isère","mode":"shuttle","typical_carriers":["Altibus"],"duration_hours":2,"distance_km":130,"notes":"最近的机场，转车最短"}
  ]},
  {"id":"R4","name":"Eurostar Snow 滑雪专线直达","name_en":"Eurostar Snow train direct","total_duration_hours":8.5,"price_tier":"mid","complexity":"simple","tags":["仅限冬季","最舒适","纯火车"],"legs":[
    {"from":"London St Pancras","to":"Lille","mode":"train","typical_carriers":["Eurostar"],"duration_hours":1.5,"distance_km":340,"notes":"周六 09:01 发车"},
    {"from":"Lille","to":"Bourg-Saint-Maurice","mode":"train","typical_carriers":["Eurostar Snow"],"duration_hours":6,"distance_km":780,"notes":"冬季专线 Dec-Mar"},
    {"from":"Bourg-Saint-Maurice","to":"Val d'Isère","mode":"shuttle","typical_carriers":["navette","local bus"],"duration_hours":0.5,"distance_km":32,"notes":"火车站外直接有 shuttle，30分钟上山"}
  ]},
  {"id":"R5","name":"全程火车 London→Paris→Val d'Isère","name_en":"Eurostar + TGV + bus","total_duration_hours":9,"price_tier":"mid","complexity":"complex","tags":["纯火车"],"legs":[
    {"from":"London St Pancras","to":"Paris Gare du Nord","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris Gare de Lyon","to":"Bourg-Saint-Maurice","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":5,"distance_km":680,"notes":"TGV 冬季直达 BSM"},
    {"from":"Bourg-Saint-Maurice","to":"Val d'Isère","mode":"shuttle","typical_carriers":["navette"],"duration_hours":0.5,"distance_km":32,"notes":""}
  ]},
  {"id":"R6","name":"FlixBus 夜车","name_en":"FlixBus overnight","total_duration_hours":15,"price_tier":"budget","complexity":"simple","tags":["夜车省住宿"],"legs":[
    {"from":"London","to":"Lyon","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":11,"distance_km":760,"notes":"夜班车"},
    {"from":"Lyon","to":"Val d'Isère","mode":"bus","typical_carriers":["FlixBus","Altibus"],"duration_hours":4,"distance_km":240,"notes":"早上到 Lyon 转日班车上山"}
  ]}
]},

"london::tignes": {"routes":[
  {"id":"R1","name":"飞 Geneva，大巴直达 Tignes","name_en":"Fly Geneva + shuttle","total_duration_hours":5,"price_tier":"budget","complexity":"simple","tags":["最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"Tignes","mode":"shuttle","typical_carriers":["Bens Bus","AlpyBus"],"duration_hours":3,"distance_km":210,"notes":"直达 shuttle 约 €40-55"}
  ]},
  {"id":"R2","name":"飞 Lyon + 大巴","name_en":"Fly Lyon + bus","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW/STN","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Tignes","mode":"bus","typical_carriers":["Altibus"],"duration_hours":3.5,"distance_km":230,"notes":"冬季 Altibus 直达"}
  ]},
  {"id":"R3","name":"Eurostar Snow 滑雪专线直达","name_en":"Eurostar Snow direct","total_duration_hours":8.5,"price_tier":"mid","complexity":"simple","tags":["仅限冬季","纯火车"],"legs":[
    {"from":"London St Pancras","to":"Lille","mode":"train","typical_carriers":["Eurostar"],"duration_hours":1.5,"distance_km":340,"notes":"周六 09:01"},
    {"from":"Lille","to":"Bourg-Saint-Maurice","mode":"train","typical_carriers":["Eurostar Snow"],"duration_hours":6,"distance_km":780,"notes":""},
    {"from":"Bourg-Saint-Maurice","to":"Tignes","mode":"shuttle","typical_carriers":["navette"],"duration_hours":0.75,"distance_km":28,"notes":"BSM 站外有直达 shuttle"}
  ]},
  {"id":"R4","name":"飞 Chambéry + 短途转车","name_en":"Fly Chambéry + transfer","total_duration_hours":4.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Chambéry","mode":"flight","typical_carriers":["Jet2"],"duration_hours":1.75,"distance_km":780,"from_code":"STN","to_code":"CMF","notes":"冬季包机"},
    {"from":"Chambéry","to":"Tignes","mode":"shuttle","typical_carriers":["Altibus"],"duration_hours":2.25,"distance_km":140,"notes":""}
  ]},
  {"id":"R5","name":"全程火车经 Paris","name_en":"Eurostar + TGV","total_duration_hours":9,"price_tier":"mid","complexity":"complex","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Bourg-Saint-Maurice","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":5,"distance_km":680,"notes":""},
    {"from":"Bourg-Saint-Maurice","to":"Tignes","mode":"shuttle","typical_carriers":["navette"],"duration_hours":0.75,"distance_km":28,"notes":""}
  ]}
]},

"london::courchevel": {"routes":[
  {"id":"R1","name":"飞 Geneva，大巴到 Courchevel","name_en":"Fly Geneva + bus","total_duration_hours":5,"price_tier":"budget","complexity":"simple","tags":["最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS","BA"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"Courchevel","mode":"shuttle","typical_carriers":["AlpyBus","Bens Bus"],"duration_hours":2.75,"distance_km":180,"notes":"经 Moûtiers 上山，约 €50-65"}
  ]},
  {"id":"R2","name":"飞 Lyon + 大巴","name_en":"Fly Lyon + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW/STN","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Courchevel","mode":"bus","typical_carriers":["Altibus"],"duration_hours":3,"distance_km":190,"notes":"Altibus 经 Moûtiers"}
  ]},
  {"id":"R3","name":"Eurostar Snow 滑雪专线直达 Moûtiers","name_en":"Eurostar Snow to Moûtiers","total_duration_hours":8.5,"price_tier":"mid","complexity":"simple","tags":["仅限冬季","最舒适"],"legs":[
    {"from":"London St Pancras","to":"Lille","mode":"train","typical_carriers":["Eurostar"],"duration_hours":1.5,"distance_km":340,"notes":"周六 09:01"},
    {"from":"Lille","to":"Moûtiers","mode":"train","typical_carriers":["Eurostar Snow"],"duration_hours":5.5,"distance_km":740,"notes":"Moûtiers 是三峡谷门户站，不用坐到终点"},
    {"from":"Moûtiers","to":"Courchevel","mode":"shuttle","typical_carriers":["navette","taxi"],"duration_hours":0.5,"distance_km":25,"notes":"火车站外直接有上山 shuttle"}
  ]},
  {"id":"R4","name":"飞 Chambéry + 短途转车","name_en":"Fly Chambéry + transfer","total_duration_hours":4,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Chambéry","mode":"flight","typical_carriers":["Jet2","BA"],"duration_hours":1.75,"distance_km":780,"from_code":"STN/LHR","to_code":"CMF","notes":"冬季包机"},
    {"from":"Chambéry","to":"Courchevel","mode":"shuttle","typical_carriers":["Altibus"],"duration_hours":1.5,"distance_km":100,"notes":"Chambéry 是离三峡谷最近的机场"}
  ]},
  {"id":"R5","name":"全程火车经 Paris","name_en":"Eurostar + TGV to Moûtiers","total_duration_hours":8.5,"price_tier":"mid","complexity":"moderate","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Moûtiers","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":4.5,"distance_km":650,"notes":"TGV 冬季直达 Moûtiers"},
    {"from":"Moûtiers","to":"Courchevel","mode":"shuttle","typical_carriers":["navette"],"duration_hours":0.5,"distance_km":25,"notes":""}
  ]}
]},

"london::méribel": {"routes":[
  {"id":"R1","name":"飞 Geneva，巴士到 Méribel","name_en":"Fly Geneva + bus","total_duration_hours":5,"price_tier":"budget","complexity":"simple","tags":["最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS","BA"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"Méribel","mode":"shuttle","typical_carriers":["AlpyBus","Bens Bus"],"duration_hours":2.5,"distance_km":175,"notes":"经 Moûtiers 上山"}
  ]},
  {"id":"R2","name":"Eurostar Snow 到 Moûtiers 直达","name_en":"Eurostar Snow to Moûtiers","total_duration_hours":8,"price_tier":"mid","complexity":"simple","tags":["仅限冬季","最舒适"],"legs":[
    {"from":"London St Pancras","to":"Lille","mode":"train","typical_carriers":["Eurostar"],"duration_hours":1.5,"distance_km":340,"notes":""},
    {"from":"Lille","to":"Moûtiers","mode":"train","typical_carriers":["Eurostar Snow"],"duration_hours":5.5,"distance_km":740,"notes":"Moûtiers 站下车"},
    {"from":"Moûtiers","to":"Méribel","mode":"shuttle","typical_carriers":["navette"],"duration_hours":0.5,"distance_km":18,"notes":"站外 shuttle 直达，Méribel 是英国人最爱的三峡谷入口"}
  ]},
  {"id":"R3","name":"飞 Chambéry + 转车","name_en":"Fly Chambéry","total_duration_hours":4,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Chambéry","mode":"flight","typical_carriers":["Jet2"],"duration_hours":1.75,"distance_km":780,"from_code":"STN","to_code":"CMF","notes":"冬季包机周六"},
    {"from":"Chambéry","to":"Méribel","mode":"shuttle","typical_carriers":["Altibus"],"duration_hours":1.5,"distance_km":95,"notes":""}
  ]},
  {"id":"R4","name":"飞 Lyon + 大巴","name_en":"Fly Lyon + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW/STN","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Méribel","mode":"bus","typical_carriers":["Altibus"],"duration_hours":3,"distance_km":185,"notes":""}
  ]},
  {"id":"R5","name":"全程火车经 Paris","name_en":"Eurostar + TGV to Moûtiers","total_duration_hours":8.5,"price_tier":"mid","complexity":"moderate","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Moûtiers","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":4.5,"distance_km":650,"notes":""},
    {"from":"Moûtiers","to":"Méribel","mode":"shuttle","typical_carriers":["navette"],"duration_hours":0.5,"distance_km":18,"notes":""}
  ]}
]},

"london::val thorens": {"routes":[
  {"id":"R1","name":"飞 Geneva，巴士到 Val Thorens","name_en":"Fly Geneva + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"simple","tags":["最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"Val Thorens","mode":"shuttle","typical_carriers":["Bens Bus","AlpyBus"],"duration_hours":3.25,"distance_km":195,"notes":"经 Moûtiers 上山，最后一段山路弯多"}
  ]},
  {"id":"R2","name":"Eurostar Snow 到 Moûtiers","name_en":"Eurostar Snow to Moûtiers","total_duration_hours":8.5,"price_tier":"mid","complexity":"simple","tags":["仅限冬季","纯火车"],"legs":[
    {"from":"London St Pancras","to":"Lille","mode":"train","typical_carriers":["Eurostar"],"duration_hours":1.5,"distance_km":340,"notes":""},
    {"from":"Lille","to":"Moûtiers","mode":"train","typical_carriers":["Eurostar Snow"],"duration_hours":5.5,"distance_km":740,"notes":""},
    {"from":"Moûtiers","to":"Val Thorens","mode":"shuttle","typical_carriers":["navette"],"duration_hours":1,"distance_km":37,"notes":"山路 37km，约1小时"}
  ]},
  {"id":"R3","name":"飞 Chambéry + 转车","name_en":"Fly Chambéry","total_duration_hours":4.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Chambéry","mode":"flight","typical_carriers":["Jet2"],"duration_hours":1.75,"distance_km":780,"from_code":"STN","to_code":"CMF","notes":""},
    {"from":"Chambéry","to":"Val Thorens","mode":"shuttle","typical_carriers":["Altibus"],"duration_hours":2,"distance_km":115,"notes":""}
  ]},
  {"id":"R4","name":"飞 Lyon + 大巴","name_en":"Fly Lyon + bus","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW/STN","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Val Thorens","mode":"bus","typical_carriers":["Altibus"],"duration_hours":3.5,"distance_km":200,"notes":""}
  ]},
  {"id":"R5","name":"全程火车经 Paris","name_en":"Eurostar + TGV","total_duration_hours":9,"price_tier":"mid","complexity":"moderate","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Moûtiers","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":4.5,"distance_km":650,"notes":""},
    {"from":"Moûtiers","to":"Val Thorens","mode":"shuttle","typical_carriers":["navette"],"duration_hours":1,"distance_km":37,"notes":""}
  ]}
]},

"london::la plagne": {"routes":[
  {"id":"R1","name":"飞 Geneva + 巴士","name_en":"Fly Geneva + bus","total_duration_hours":5,"price_tier":"budget","complexity":"simple","tags":["最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva","to":"La Plagne","mode":"shuttle","typical_carriers":["AlpyBus","Bens Bus"],"duration_hours":2.75,"distance_km":180,"notes":"经 Aime-la-Plagne"}
  ]},
  {"id":"R2","name":"Eurostar Snow 直达 Aime-la-Plagne","name_en":"Eurostar Snow direct","total_duration_hours":8,"price_tier":"mid","complexity":"simple","tags":["仅限冬季","最舒适"],"legs":[
    {"from":"London St Pancras","to":"Lille","mode":"train","typical_carriers":["Eurostar"],"duration_hours":1.5,"distance_km":340,"notes":""},
    {"from":"Lille","to":"Aime-la-Plagne","mode":"train","typical_carriers":["Eurostar Snow"],"duration_hours":5.75,"distance_km":760,"notes":"在 Aime-la-Plagne 站下，不用坐到终点"},
    {"from":"Aime-la-Plagne","to":"La Plagne","mode":"shuttle","typical_carriers":["funicular","navette"],"duration_hours":0.25,"distance_km":5,"notes":"站外直接坐缆车/shuttle 上山，超方便"}
  ]},
  {"id":"R3","name":"飞 Chambéry + 转车","name_en":"Fly Chambéry","total_duration_hours":4,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Chambéry","mode":"flight","typical_carriers":["Jet2"],"duration_hours":1.75,"distance_km":780,"from_code":"STN","to_code":"CMF","notes":"冬季包机"},
    {"from":"Chambéry","to":"La Plagne","mode":"shuttle","typical_carriers":["Altibus"],"duration_hours":1.75,"distance_km":105,"notes":""}
  ]},
  {"id":"R4","name":"飞 Lyon + 大巴","name_en":"Fly Lyon + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW/STN","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"La Plagne","mode":"bus","typical_carriers":["Altibus"],"duration_hours":3,"distance_km":185,"notes":""}
  ]},
  {"id":"R5","name":"全程火车经 Paris","name_en":"Eurostar + TGV","total_duration_hours":8.5,"price_tier":"mid","complexity":"moderate","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Aime-la-Plagne","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":4.75,"distance_km":660,"notes":"TGV 直达 Aime"},
    {"from":"Aime-la-Plagne","to":"La Plagne","mode":"shuttle","typical_carriers":["funicular"],"duration_hours":0.25,"distance_km":5,"notes":""}
  ]}
]},

"london::les arcs": {"routes":[
  {"id":"R1","name":"飞 Geneva + 巴士","name_en":"Fly Geneva + bus","total_duration_hours":5,"price_tier":"budget","complexity":"simple","tags":["最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva","to":"Les Arcs","mode":"shuttle","typical_carriers":["AlpyBus","Bens Bus"],"duration_hours":3,"distance_km":190,"notes":"经 Bourg-Saint-Maurice 上山"}
  ]},
  {"id":"R2","name":"Eurostar Snow 直达 Bourg-Saint-Maurice","name_en":"Eurostar Snow direct","total_duration_hours":8.5,"price_tier":"mid","complexity":"simple","tags":["仅限冬季","最舒适"],"legs":[
    {"from":"London St Pancras","to":"Lille","mode":"train","typical_carriers":["Eurostar"],"duration_hours":1.5,"distance_km":340,"notes":""},
    {"from":"Lille","to":"Bourg-Saint-Maurice","mode":"train","typical_carriers":["Eurostar Snow"],"duration_hours":6,"distance_km":780,"notes":"终点站下车"},
    {"from":"Bourg-Saint-Maurice","to":"Les Arcs","mode":"shuttle","typical_carriers":["funicular"],"duration_hours":0.25,"distance_km":7,"notes":"BSM 站旁直接坐 funicular 7分钟上山到 Arc 1600"}
  ]},
  {"id":"R3","name":"飞 Chambéry + 转车","name_en":"Fly Chambéry","total_duration_hours":4.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Chambéry","mode":"flight","typical_carriers":["Jet2"],"duration_hours":1.75,"distance_km":780,"from_code":"STN","to_code":"CMF","notes":""},
    {"from":"Chambéry","to":"Les Arcs","mode":"shuttle","typical_carriers":["Altibus"],"duration_hours":2,"distance_km":120,"notes":""}
  ]},
  {"id":"R4","name":"全程火车经 Paris","name_en":"Eurostar + TGV","total_duration_hours":8.5,"price_tier":"mid","complexity":"moderate","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Bourg-Saint-Maurice","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":5,"distance_km":680,"notes":""},
    {"from":"Bourg-Saint-Maurice","to":"Les Arcs","mode":"shuttle","typical_carriers":["funicular"],"duration_hours":0.25,"distance_km":7,"notes":""}
  ]},
  {"id":"R5","name":"飞 Lyon + 大巴","name_en":"Fly Lyon + bus","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW/STN","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Les Arcs","mode":"bus","typical_carriers":["Altibus"],"duration_hours":3.5,"distance_km":200,"notes":""}
  ]}
]},

"london::alpe d'huez": {"routes":[
  {"id":"R1","name":"飞 Grenoble，巴士直达","name_en":"Fly Grenoble + shuttle","total_duration_hours":3.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Grenoble","mode":"flight","typical_carriers":["easyJet","Jet2"],"duration_hours":1.75,"distance_km":780,"from_code":"LTN/STN","to_code":"GNB","notes":"冬季航线，easyJet Luton"},
    {"from":"Grenoble Airport","to":"Alpe d'Huez","mode":"shuttle","typical_carriers":["Altibus","BensBus"],"duration_hours":1.5,"distance_km":100,"notes":"直达 shuttle 约 €40"}
  ]},
  {"id":"R2","name":"飞 Lyon + 大巴","name_en":"Fly Lyon + bus","total_duration_hours":5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW/STN","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Alpe d'Huez","mode":"bus","typical_carriers":["FlixBus","Altibus"],"duration_hours":2.5,"distance_km":150,"notes":"经 Grenoble"}
  ]},
  {"id":"R3","name":"飞 Geneva + 大巴","name_en":"Fly Geneva + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW","to_code":"GVA","notes":""},
    {"from":"Geneva","to":"Alpe d'Huez","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":3.5,"distance_km":210,"notes":"经 Grenoble 转车"}
  ]},
  {"id":"R4","name":"全程火车经 Paris + Grenoble","name_en":"Eurostar + TGV to Grenoble","total_duration_hours":8,"price_tier":"mid","complexity":"moderate","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Grenoble","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":3,"distance_km":575,"notes":"TGV 3小时直达 Grenoble"},
    {"from":"Grenoble","to":"Alpe d'Huez","mode":"bus","typical_carriers":["VFD bus"],"duration_hours":1.5,"distance_km":65,"notes":""}
  ]}
]},

"london::les deux alpes": {"routes":[
  {"id":"R1","name":"飞 Grenoble，巴士直达","name_en":"Fly Grenoble + shuttle","total_duration_hours":3.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Grenoble","mode":"flight","typical_carriers":["easyJet","Jet2"],"duration_hours":1.75,"distance_km":780,"from_code":"LTN/STN","to_code":"GNB","notes":"冬季航线"},
    {"from":"Grenoble Airport","to":"Les Deux Alpes","mode":"shuttle","typical_carriers":["Altibus"],"duration_hours":1.75,"distance_km":110,"notes":"经 Bourg-d'Oisans"}
  ]},
  {"id":"R2","name":"飞 Lyon + 大巴","name_en":"Fly Lyon + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW/STN","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Les Deux Alpes","mode":"bus","typical_carriers":["Altibus"],"duration_hours":3,"distance_km":160,"notes":""}
  ]},
  {"id":"R3","name":"全程火车经 Grenoble","name_en":"Eurostar + TGV + bus","total_duration_hours":8.5,"price_tier":"mid","complexity":"moderate","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Grenoble","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":3,"distance_km":575,"notes":""},
    {"from":"Grenoble","to":"Les Deux Alpes","mode":"bus","typical_carriers":["VFD"],"duration_hours":2,"distance_km":75,"notes":""}
  ]},
  {"id":"R4","name":"飞 Geneva + 大巴","name_en":"Fly Geneva + bus","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW","to_code":"GVA","notes":""},
    {"from":"Geneva","to":"Les Deux Alpes","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":4,"distance_km":220,"notes":"经 Grenoble"}
  ]}
]},

"london::morzine": {"routes":[
  {"id":"R1","name":"飞 Geneva，巴士直达 Morzine","name_en":"Fly Geneva + shuttle","total_duration_hours":3,"price_tier":"budget","complexity":"simple","tags":["最快","最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS","BA"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"Morzine","mode":"shuttle","typical_carriers":["AlpyBus","Skiidy Gonzales"],"duration_hours":1.25,"distance_km":80,"notes":"Geneva 到 Morzine 最近，只要 1h15！约 €30"}
  ]},
  {"id":"R2","name":"全程火车经 Paris + Cluses","name_en":"Eurostar + TGV + bus","total_duration_hours":8,"price_tier":"mid","complexity":"moderate","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Cluses","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":4,"distance_km":580,"notes":"TGV 到 Cluses"},
    {"from":"Cluses","to":"Morzine","mode":"bus","typical_carriers":["SAT bus"],"duration_hours":0.75,"distance_km":35,"notes":""}
  ]},
  {"id":"R3","name":"FlixBus 夜车","name_en":"FlixBus overnight","total_duration_hours":12,"price_tier":"budget","complexity":"simple","tags":["夜车省住宿"],"legs":[
    {"from":"London","to":"Morzine","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":12,"distance_km":850,"notes":"夜车经 Paris，£25-45"}
  ]},
  {"id":"R4","name":"飞 Lyon + 大巴","name_en":"Fly Lyon + bus","total_duration_hours":5,"price_tier":"budget","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Morzine","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":3,"distance_km":210,"notes":"经 Annecy/Cluses"}
  ]}
]},

"london::avoriaz": {"routes":[
  {"id":"R1","name":"飞 Geneva，巴士到 Avoriaz","name_en":"Fly Geneva + shuttle","total_duration_hours":3.5,"price_tier":"budget","complexity":"simple","tags":["最快","最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"Avoriaz","mode":"shuttle","typical_carriers":["AlpyBus"],"duration_hours":1.75,"distance_km":95,"notes":"经 Morzine 上山到 Avoriaz，无车村庄需坐缆车进村"}
  ]},
  {"id":"R2","name":"全程火车经 Cluses","name_en":"Eurostar + TGV + bus","total_duration_hours":8.5,"price_tier":"mid","complexity":"moderate","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Cluses","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":4,"distance_km":580,"notes":""},
    {"from":"Cluses","to":"Avoriaz","mode":"bus","typical_carriers":["SAT bus"],"duration_hours":1,"distance_km":40,"notes":"经 Morzine"}
  ]},
  {"id":"R3","name":"飞 Lyon + 大巴","name_en":"Fly Lyon","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Avoriaz","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":3,"distance_km":220,"notes":""}
  ]}
]},

"london::les gets": {"routes":[
  {"id":"R1","name":"飞 Geneva，巴士直达","name_en":"Fly Geneva + shuttle","total_duration_hours":3,"price_tier":"budget","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"Les Gets","mode":"shuttle","typical_carriers":["AlpyBus"],"duration_hours":1.25,"distance_km":75,"notes":"和 Morzine 一样近"}
  ]},
  {"id":"R2","name":"全程火车经 Cluses","name_en":"Train via Cluses","total_duration_hours":8,"price_tier":"mid","complexity":"moderate","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Cluses","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":4,"distance_km":580,"notes":""},
    {"from":"Cluses","to":"Les Gets","mode":"bus","typical_carriers":["SAT bus"],"duration_hours":0.5,"distance_km":25,"notes":"比 Morzine 还近一点"}
  ]},
  {"id":"R3","name":"飞 Lyon + 大巴","name_en":"Fly Lyon + bus","total_duration_hours":5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Les Gets","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":2.75,"distance_km":200,"notes":""}
  ]}
]},

"london::flaine": {"routes":[
  {"id":"R1","name":"飞 Geneva，巴士到 Flaine","name_en":"Fly Geneva + shuttle","total_duration_hours":3,"price_tier":"budget","complexity":"simple","tags":["最快","最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"Flaine","mode":"shuttle","typical_carriers":["AlpyBus"],"duration_hours":1.25,"distance_km":82,"notes":"Geneva 到 Flaine 很近，只要 1h15"}
  ]},
  {"id":"R2","name":"全程火车经 Cluses","name_en":"Train via Cluses","total_duration_hours":8,"price_tier":"mid","complexity":"moderate","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Cluses","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":4,"distance_km":580,"notes":""},
    {"from":"Cluses","to":"Flaine","mode":"bus","typical_carriers":["SAT bus"],"duration_hours":0.5,"distance_km":30,"notes":"Cluses 是 Flaine 最近的火车站"}
  ]},
  {"id":"R3","name":"飞 Lyon + 大巴","name_en":"Fly Lyon","total_duration_hours":5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Flaine","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":2.75,"distance_km":190,"notes":""}
  ]}
]},

"london::megève": {"routes":[
  {"id":"R1","name":"飞 Geneva，巴士到 Megève","name_en":"Fly Geneva + shuttle","total_duration_hours":3.5,"price_tier":"budget","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"Megève","mode":"shuttle","typical_carriers":["AlpyBus"],"duration_hours":1.5,"distance_km":80,"notes":""}
  ]},
  {"id":"R2","name":"全程火车经 Saint-Gervais","name_en":"Eurostar + TGV","total_duration_hours":8.5,"price_tier":"mid","complexity":"moderate","tags":["纯火车","风景最美"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Saint-Gervais","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":5.5,"distance_km":620,"notes":"冬季 TGV 直达"},
    {"from":"Saint-Gervais","to":"Megève","mode":"bus","typical_carriers":["SAT bus"],"duration_hours":0.25,"distance_km":12,"notes":"很近"}
  ]},
  {"id":"R3","name":"飞 Lyon + 大巴","name_en":"Fly Lyon","total_duration_hours":5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Megève","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":2.75,"distance_km":200,"notes":"经 Albertville"}
  ]}
]},

"london::la clusaz": {"routes":[
  {"id":"R1","name":"飞 Geneva，巴士到 La Clusaz","name_en":"Fly Geneva + shuttle","total_duration_hours":3,"price_tier":"budget","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"La Clusaz","mode":"shuttle","typical_carriers":["AlpyBus"],"duration_hours":1.25,"distance_km":65,"notes":"经 Annecy，很近！"}
  ]},
  {"id":"R2","name":"飞 Lyon + 大巴","name_en":"Fly Lyon","total_duration_hours":4.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"La Clusaz","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":2.25,"distance_km":150,"notes":"经 Annecy"}
  ]},
  {"id":"R3","name":"全程火车经 Annecy","name_en":"Eurostar + TGV + bus","total_duration_hours":7.5,"price_tier":"mid","complexity":"moderate","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Annecy","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":3.75,"distance_km":540,"notes":"TGV 直达 Annecy"},
    {"from":"Annecy","to":"La Clusaz","mode":"bus","typical_carriers":["local bus"],"duration_hours":0.75,"distance_km":32,"notes":""}
  ]}
]},

"london::serre chevalier": {"routes":[
  {"id":"R1","name":"飞 Turin + 大巴翻山","name_en":"Fly Turin + bus over Col","total_duration_hours":5,"price_tier":"budget","complexity":"moderate","tags":["最快","创意路线"],"legs":[
    {"from":"London","to":"Turin","mode":"flight","typical_carriers":["Ryanair","Wizz Air"],"duration_hours":2,"distance_km":950,"from_code":"STN/LTN","to_code":"TRN","notes":"廉航常有 £15-30"},
    {"from":"Turin","to":"Serre Chevalier","mode":"bus","typical_carriers":["SAVDA","Résalp"],"duration_hours":2.5,"distance_km":130,"notes":"经 Montgenèvre 翻过 Col，意法边境"}
  ]},
  {"id":"R2","name":"飞 Grenoble + 大巴","name_en":"Fly Grenoble + bus","total_duration_hours":4.5,"price_tier":"mid","complexity":"simple","tags":[],"legs":[
    {"from":"London","to":"Grenoble","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.75,"distance_km":780,"from_code":"LTN","to_code":"GNB","notes":"冬季航线"},
    {"from":"Grenoble","to":"Serre Chevalier","mode":"bus","typical_carriers":["LER bus"],"duration_hours":2.25,"distance_km":110,"notes":"经 Col du Lautaret"}
  ]},
  {"id":"R3","name":"飞 Lyon + 大巴","name_en":"Fly Lyon + bus","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW/STN","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"Serre Chevalier","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":3.5,"distance_km":200,"notes":"经 Grenoble"}
  ]},
  {"id":"R4","name":"全程火车到 Briançon","name_en":"Eurostar + TGV + local train","total_duration_hours":10,"price_tier":"mid","complexity":"complex","tags":["纯火车","风景最美"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Grenoble","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":3,"distance_km":575,"notes":""},
    {"from":"Grenoble","to":"Briançon","mode":"train","typical_carriers":["TER"],"duration_hours":3.5,"distance_km":115,"notes":"慢车翻山，风景极美，经 La Meije 冰川"},
    {"from":"Briançon","to":"Serre Chevalier","mode":"shuttle","typical_carriers":["local bus"],"duration_hours":0.25,"distance_km":6,"notes":""}
  ]}
]},

"london::la rosière": {"routes":[
  {"id":"R1","name":"飞 Geneva + 大巴","name_en":"Fly Geneva + bus","total_duration_hours":5,"price_tier":"budget","complexity":"simple","tags":["最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva","to":"La Rosière","mode":"shuttle","typical_carriers":["AlpyBus"],"duration_hours":3,"distance_km":190,"notes":"经 Bourg-Saint-Maurice 上山"}
  ]},
  {"id":"R2","name":"Eurostar Snow 到 Bourg-Saint-Maurice","name_en":"Eurostar Snow direct","total_duration_hours":9,"price_tier":"mid","complexity":"simple","tags":["仅限冬季","纯火车"],"legs":[
    {"from":"London St Pancras","to":"Lille","mode":"train","typical_carriers":["Eurostar"],"duration_hours":1.5,"distance_km":340,"notes":""},
    {"from":"Lille","to":"Bourg-Saint-Maurice","mode":"train","typical_carriers":["Eurostar Snow"],"duration_hours":6,"distance_km":780,"notes":""},
    {"from":"Bourg-Saint-Maurice","to":"La Rosière","mode":"shuttle","typical_carriers":["navette"],"duration_hours":0.75,"distance_km":25,"notes":"上山约 45 分钟"}
  ]},
  {"id":"R3","name":"飞 Chambéry + 转车","name_en":"Fly Chambéry","total_duration_hours":4.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Chambéry","mode":"flight","typical_carriers":["Jet2"],"duration_hours":1.75,"distance_km":780,"from_code":"STN","to_code":"CMF","notes":"冬季包机"},
    {"from":"Chambéry","to":"La Rosière","mode":"shuttle","typical_carriers":["Altibus"],"duration_hours":2.25,"distance_km":125,"notes":""}
  ]},
  {"id":"R4","name":"飞 Lyon + 大巴","name_en":"Fly Lyon","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Lyon","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.75,"distance_km":760,"from_code":"LGW","to_code":"LYS","notes":""},
    {"from":"Lyon","to":"La Rosière","mode":"bus","typical_carriers":["Altibus"],"duration_hours":3.5,"distance_km":200,"notes":""}
  ]}
]}

,


"london::cortina d'ampezzo": {"routes":[
  {"id":"R1","name":"飞 Venice，大巴直达 Cortina","name_en":"Fly Venice + direct bus","total_duration_hours":5,"price_tier":"budget","complexity":"simple","tags":["最快","最热门"],"legs":[
    {"from":"London","to":"Venice","mode":"flight","typical_carriers":["easyJet","Ryanair","BA"],"duration_hours":2.25,"distance_km":1100,"from_code":"LGW/STN/LHR","to_code":"VCE/TSF","notes":"easyJet 飞 Marco Polo (VCE)，Ryanair 飞 Treviso (TSF)"},
    {"from":"Venice","to":"Cortina d'Ampezzo","mode":"bus","typical_carriers":["Cortina Express","ATVO"],"duration_hours":2.25,"distance_km":160,"notes":"Cortina Express 直达巴士，约 €15"}
  ]},
  {"id":"R2","name":"飞 Innsbruck + 大巴翻山","name_en":"Fly Innsbruck + bus over Brenner","total_duration_hours":5.5,"price_tier":"mid","complexity":"moderate","tags":["创意路线"],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet","BA"],"duration_hours":2,"distance_km":1000,"from_code":"LGW/LHR","to_code":"INN","notes":"easyJet Gatwick 直飞"},
    {"from":"Innsbruck","to":"Cortina","mode":"bus","typical_carriers":["FlixBus","SAD bus"],"duration_hours":3,"distance_km":165,"notes":"经 Brenner Pass→Bolzano→Cortina"}
  ]},
  {"id":"R3","name":"飞 Treviso 廉航 + 大巴","name_en":"Fly Treviso (Ryanair) + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Treviso","mode":"flight","typical_carriers":["Ryanair"],"duration_hours":2.25,"distance_km":1080,"from_code":"STN","to_code":"TSF","notes":"Ryanair 常有 £15-30"},
    {"from":"Treviso","to":"Cortina","mode":"bus","typical_carriers":["Cortina Express"],"duration_hours":2.5,"distance_km":150,"notes":""}
  ]},
  {"id":"R4","name":"飞 Venice + 火车到 Belluno + 大巴","name_en":"Fly Venice + train + bus","total_duration_hours":6,"price_tier":"budget","complexity":"complex","tags":[],"legs":[
    {"from":"London","to":"Venice","mode":"flight","typical_carriers":["easyJet"],"duration_hours":2.25,"distance_km":1100,"from_code":"LGW","to_code":"VCE","notes":""},
    {"from":"Venice","to":"Calalzo di Cadore","mode":"train","typical_carriers":["Trenitalia"],"duration_hours":2.5,"distance_km":130,"notes":"沿 Piave 河谷北上，风景好"},
    {"from":"Calalzo","to":"Cortina","mode":"bus","typical_carriers":["Dolomiti Bus"],"duration_hours":0.75,"distance_km":35,"notes":""}
  ]},
  {"id":"R5","name":"飞 Verona + 自驾/大巴","name_en":"Fly Verona + bus","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Verona","mode":"flight","typical_carriers":["Ryanair","Wizz Air"],"duration_hours":2,"distance_km":1030,"from_code":"STN/LTN","to_code":"VRN","notes":""},
    {"from":"Verona","to":"Cortina","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":3.5,"distance_km":230,"notes":"经 Brenner→Bolzano 或 A27"}
  ]}
]},

"london::val gardena (selva)": {"routes":[
  {"id":"R1","name":"飞 Innsbruck，大巴翻 Brenner Pass","name_en":"Fly Innsbruck + bus","total_duration_hours":4.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet","BA"],"duration_hours":2,"distance_km":1000,"from_code":"LGW/LHR","to_code":"INN","notes":""},
    {"from":"Innsbruck","to":"Selva Val Gardena","mode":"bus","typical_carriers":["SAD bus","FlixBus"],"duration_hours":2,"distance_km":100,"notes":"经 Brenner→Bolzano→Val Gardena，沿途进入 Dolomites"}
  ]},
  {"id":"R2","name":"飞 Verona + 大巴","name_en":"Fly Verona + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Verona","mode":"flight","typical_carriers":["Ryanair","Wizz Air"],"duration_hours":2,"distance_km":1030,"from_code":"STN/LTN","to_code":"VRN","notes":"廉航 £20-40"},
    {"from":"Verona","to":"Selva Val Gardena","mode":"bus","typical_carriers":["FlixBus","SAD"],"duration_hours":3,"distance_km":190,"notes":"经 Brennero→Bolzano→Val Gardena"}
  ]},
  {"id":"R3","name":"飞 Venice + 火车到 Bolzano + 大巴","name_en":"Fly Venice + train + bus","total_duration_hours":6.5,"price_tier":"budget","complexity":"complex","tags":[],"legs":[
    {"from":"London","to":"Venice","mode":"flight","typical_carriers":["easyJet"],"duration_hours":2.25,"distance_km":1100,"from_code":"LGW","to_code":"VCE","notes":""},
    {"from":"Venice","to":"Bolzano","mode":"train","typical_carriers":["Trenitalia"],"duration_hours":3,"distance_km":230,"notes":""},
    {"from":"Bolzano","to":"Selva Val Gardena","mode":"bus","typical_carriers":["SAD bus"],"duration_hours":1,"distance_km":40,"notes":""}
  ]},
  {"id":"R4","name":"飞 Bergamo + 火车到 Bolzano + 大巴","name_en":"Fly Bergamo + train + bus","total_duration_hours":6,"price_tier":"budget","complexity":"complex","tags":["最便宜"],"legs":[
    {"from":"London","to":"Bergamo","mode":"flight","typical_carriers":["Ryanair"],"duration_hours":2,"distance_km":960,"from_code":"STN","to_code":"BGY","notes":"Ryanair £15-25"},
    {"from":"Bergamo","to":"Bolzano","mode":"train","typical_carriers":["Trenitalia"],"duration_hours":2.75,"distance_km":210,"notes":"经 Verona 换车"},
    {"from":"Bolzano","to":"Selva Val Gardena","mode":"bus","typical_carriers":["SAD bus"],"duration_hours":1,"distance_km":40,"notes":""}
  ]}
]},

"london::alta badia": {"routes":[
  {"id":"R1","name":"飞 Innsbruck + 大巴","name_en":"Fly Innsbruck + bus","total_duration_hours":5,"price_tier":"mid","complexity":"moderate","tags":["最快"],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet"],"duration_hours":2,"distance_km":1000,"from_code":"LGW","to_code":"INN","notes":""},
    {"from":"Innsbruck","to":"Alta Badia","mode":"bus","typical_carriers":["SAD bus"],"duration_hours":2.5,"distance_km":115,"notes":"经 Brenner→Bolzano→Val Badia"}
  ]},
  {"id":"R2","name":"飞 Verona + 大巴","name_en":"Fly Verona + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Verona","mode":"flight","typical_carriers":["Ryanair"],"duration_hours":2,"distance_km":1030,"from_code":"STN","to_code":"VRN","notes":""},
    {"from":"Verona","to":"Alta Badia","mode":"bus","typical_carriers":["FlixBus","SAD"],"duration_hours":3,"distance_km":200,"notes":""}
  ]},
  {"id":"R3","name":"飞 Venice + 大巴","name_en":"Fly Venice + bus","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Venice","mode":"flight","typical_carriers":["easyJet"],"duration_hours":2.25,"distance_km":1100,"from_code":"LGW","to_code":"VCE","notes":""},
    {"from":"Venice","to":"Alta Badia","mode":"bus","typical_carriers":["Cortina Express","SAD"],"duration_hours":3.5,"distance_km":190,"notes":"经 Belluno/Cortina 方向"}
  ]}
]},

"london::cervinia": {"routes":[
  {"id":"R1","name":"飞 Turin + 大巴到 Cervinia","name_en":"Fly Turin + bus","total_duration_hours":4.5,"price_tier":"budget","complexity":"simple","tags":["最快","最便宜"],"legs":[
    {"from":"London","to":"Turin","mode":"flight","typical_carriers":["Ryanair","Wizz Air","BA"],"duration_hours":2,"distance_km":950,"from_code":"STN/LTN/LHR","to_code":"TRN","notes":"Ryanair £15-30"},
    {"from":"Turin","to":"Cervinia","mode":"bus","typical_carriers":["SAVDA","Arriva"],"duration_hours":2,"distance_km":115,"notes":"经 Aosta Valley，SAVDA 直达约 €15"}
  ]},
  {"id":"R2","name":"飞 Milan + 大巴","name_en":"Fly Milan + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Milan","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":2,"distance_km":960,"from_code":"LGW/STN","to_code":"MXP/BGY","notes":""},
    {"from":"Milan","to":"Cervinia","mode":"bus","typical_carriers":["FlixBus","SAVDA"],"duration_hours":3,"distance_km":175,"notes":"经 Aosta"}
  ]},
  {"id":"R3","name":"飞 Geneva + 大巴穿 Great St Bernard","name_en":"Fly Geneva + bus via St Bernard","total_duration_hours":5,"price_tier":"mid","complexity":"moderate","tags":["创意路线"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW","to_code":"GVA","notes":""},
    {"from":"Geneva","to":"Cervinia","mode":"bus","typical_carriers":["shuttle"],"duration_hours":3,"distance_km":170,"notes":"经 Martigny→Grand-St-Bernard 隧道→Aosta→Cervinia"}
  ]},
  {"id":"R4","name":"全程火车经 Paris + Milan","name_en":"Eurostar + TGV + Trenitalia","total_duration_hours":10,"price_tier":"mid","complexity":"complex","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Turin","mode":"train","typical_carriers":["TGV INOUI / Frecciarossa"],"duration_hours":5.5,"distance_km":680,"notes":"高铁经 Lyon 或 Milan"},
    {"from":"Turin","to":"Cervinia","mode":"bus","typical_carriers":["SAVDA"],"duration_hours":2,"distance_km":115,"notes":""}
  ]}
]},

"london::courmayeur": {"routes":[
  {"id":"R1","name":"飞 Geneva，巴士经 Mont Blanc 隧道","name_en":"Fly Geneva + Mont Blanc Tunnel","total_duration_hours":4,"price_tier":"budget","complexity":"simple","tags":["最快","最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva","to":"Chamonix","mode":"shuttle","typical_carriers":["AlpyBus"],"duration_hours":1.5,"distance_km":88,"notes":""},
    {"from":"Chamonix","to":"Courmayeur","mode":"shuttle","typical_carriers":["Mont Blanc Tunnel shuttle"],"duration_hours":0.5,"distance_km":20,"notes":"穿 Mont Blanc 隧道 20 分钟到意大利"}
  ]},
  {"id":"R2","name":"飞 Turin + 大巴","name_en":"Fly Turin + bus","total_duration_hours":4,"price_tier":"budget","complexity":"simple","tags":["最便宜"],"legs":[
    {"from":"London","to":"Turin","mode":"flight","typical_carriers":["Ryanair","Wizz Air"],"duration_hours":2,"distance_km":950,"from_code":"STN/LTN","to_code":"TRN","notes":"£15-30"},
    {"from":"Turin","to":"Courmayeur","mode":"bus","typical_carriers":["SAVDA"],"duration_hours":1.5,"distance_km":150,"notes":"SAVDA 直达约 €12"}
  ]},
  {"id":"R3","name":"飞 Bergamo 廉航 + 大巴","name_en":"Fly Bergamo + bus","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Bergamo","mode":"flight","typical_carriers":["Ryanair"],"duration_hours":2,"distance_km":960,"from_code":"STN","to_code":"BGY","notes":""},
    {"from":"Bergamo","to":"Courmayeur","mode":"bus","typical_carriers":["FlixBus","SAVDA"],"duration_hours":3.5,"distance_km":250,"notes":"经 Milan→Aosta"}
  ]},
  {"id":"R4","name":"全程火车","name_en":"Eurostar + TGV + bus","total_duration_hours":10,"price_tier":"mid","complexity":"complex","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Saint-Gervais","mode":"train","typical_carriers":["TGV INOUI"],"duration_hours":5.5,"distance_km":620,"notes":""},
    {"from":"Saint-Gervais","to":"Chamonix","mode":"train","typical_carriers":["Mont-Blanc Express"],"duration_hours":0.75,"distance_km":22,"notes":""},
    {"from":"Chamonix","to":"Courmayeur","mode":"shuttle","typical_carriers":["tunnel shuttle"],"duration_hours":0.5,"distance_km":20,"notes":""}
  ]}
]},

"london::la thuile": {"routes":[
  {"id":"R1","name":"飞 Turin + 大巴","name_en":"Fly Turin + bus","total_duration_hours":4.5,"price_tier":"budget","complexity":"simple","tags":["最快","最便宜"],"legs":[
    {"from":"London","to":"Turin","mode":"flight","typical_carriers":["Ryanair","Wizz Air"],"duration_hours":2,"distance_km":950,"from_code":"STN/LTN","to_code":"TRN","notes":""},
    {"from":"Turin","to":"La Thuile","mode":"bus","typical_carriers":["SAVDA"],"duration_hours":2,"distance_km":160,"notes":"经 Aosta→Pré-Saint-Didier"}
  ]},
  {"id":"R2","name":"飞 Geneva + 经 Mont Blanc 隧道","name_en":"Fly Geneva + tunnel","total_duration_hours":4.5,"price_tier":"mid","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW","to_code":"GVA","notes":""},
    {"from":"Geneva","to":"Courmayeur","mode":"shuttle","typical_carriers":["AlpyBus + tunnel"],"duration_hours":2,"distance_km":108,"notes":"经 Chamonix + Mont Blanc 隧道"},
    {"from":"Courmayeur","to":"La Thuile","mode":"bus","typical_carriers":["local bus"],"duration_hours":0.5,"distance_km":20,"notes":"很近，La Rosière 在法国侧也可滑到"}
  ]},
  {"id":"R3","name":"飞 Milan + 大巴","name_en":"Fly Milan + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Milan","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":2,"distance_km":960,"from_code":"LGW/STN","to_code":"MXP/BGY","notes":""},
    {"from":"Milan","to":"La Thuile","mode":"bus","typical_carriers":["SAVDA"],"duration_hours":3,"distance_km":190,"notes":"经 Aosta"}
  ]}
]},

"london::livigno": {"routes":[
  {"id":"R1","name":"飞 Innsbruck + 大巴翻山","name_en":"Fly Innsbruck + bus","total_duration_hours":5.5,"price_tier":"mid","complexity":"moderate","tags":["最快"],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet"],"duration_hours":2,"distance_km":1000,"from_code":"LGW","to_code":"INN","notes":""},
    {"from":"Innsbruck","to":"Livigno","mode":"bus","typical_carriers":["shuttle service"],"duration_hours":3,"distance_km":140,"notes":"经 Landeck→Scuol→Livigno，穿 Munt la Schera 隧道"}
  ]},
  {"id":"R2","name":"飞 Bergamo + 大巴","name_en":"Fly Bergamo + bus","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Bergamo","mode":"flight","typical_carriers":["Ryanair"],"duration_hours":2,"distance_km":960,"from_code":"STN","to_code":"BGY","notes":"Ryanair £15-25"},
    {"from":"Bergamo","to":"Livigno","mode":"bus","typical_carriers":["Livigno Express"],"duration_hours":3.5,"distance_km":210,"notes":"冬季直达 shuttle，Livigno 是免税区！"}
  ]},
  {"id":"R3","name":"飞 Milan + 大巴","name_en":"Fly Milan + bus","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Milan","mode":"flight","typical_carriers":["easyJet"],"duration_hours":2,"distance_km":960,"from_code":"LGW","to_code":"MXP","notes":""},
    {"from":"Milan","to":"Livigno","mode":"bus","typical_carriers":["Livigno Express"],"duration_hours":3.5,"distance_km":220,"notes":""}
  ]},
  {"id":"R4","name":"飞 Zurich + 火车 + 大巴","name_en":"Fly Zurich + rail + bus","total_duration_hours":7,"price_tier":"mid","complexity":"complex","tags":["风景最美"],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["SWISS","easyJet","BA"],"duration_hours":1.75,"distance_km":780,"from_code":"LHR/LGW","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"Zernez","mode":"train","typical_carriers":["SBB"],"duration_hours":3,"distance_km":200,"notes":"瑞士火车经 Chur→Engadin"},
    {"from":"Zernez","to":"Livigno","mode":"bus","typical_carriers":["PostBus"],"duration_hours":1,"distance_km":30,"notes":"穿隧道进 Livigno"}
  ]}
]},

"london::madonna di campiglio": {"routes":[
  {"id":"R1","name":"飞 Verona + 大巴","name_en":"Fly Verona + bus","total_duration_hours":5,"price_tier":"budget","complexity":"simple","tags":["最快","最便宜"],"legs":[
    {"from":"London","to":"Verona","mode":"flight","typical_carriers":["Ryanair","Wizz Air"],"duration_hours":2,"distance_km":1030,"from_code":"STN/LTN","to_code":"VRN","notes":""},
    {"from":"Verona","to":"Madonna di Campiglio","mode":"bus","typical_carriers":["Trentino Trasporti","FlixBus"],"duration_hours":2.5,"distance_km":165,"notes":"经 Trento→Val Rendena"}
  ]},
  {"id":"R2","name":"飞 Bergamo + 大巴","name_en":"Fly Bergamo + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Bergamo","mode":"flight","typical_carriers":["Ryanair"],"duration_hours":2,"distance_km":960,"from_code":"STN","to_code":"BGY","notes":""},
    {"from":"Bergamo","to":"Madonna di Campiglio","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":3,"distance_km":170,"notes":"经 Brescia→Tione"}
  ]},
  {"id":"R3","name":"飞 Innsbruck + 大巴","name_en":"Fly Innsbruck + bus","total_duration_hours":5.5,"price_tier":"mid","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet"],"duration_hours":2,"distance_km":1000,"from_code":"LGW","to_code":"INN","notes":""},
    {"from":"Innsbruck","to":"Madonna di Campiglio","mode":"bus","typical_carriers":["SAD bus"],"duration_hours":3,"distance_km":155,"notes":"经 Brenner→Bolzano→Val di Sole"}
  ]}
]},


"london::zermatt": {"routes":[
  {"id":"R1","name":"飞 Geneva + 火车到 Zermatt","name_en":"Fly Geneva + train","total_duration_hours":5.5,"price_tier":"mid","complexity":"simple","tags":["最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"Visp","mode":"train","typical_carriers":["SBB/CFF"],"duration_hours":2,"distance_km":145,"notes":"机场直接上火车"},
    {"from":"Visp","to":"Zermatt","mode":"train","typical_carriers":["Matterhorn Gotthard Bahn"],"duration_hours":1,"distance_km":35,"notes":"齿轨火车爬升进 Zermatt，无车小镇只能火车到"}
  ]},
  {"id":"R2","name":"飞 Zurich + 火车全程","name_en":"Fly Zurich + train","total_duration_hours":6,"price_tier":"mid","complexity":"simple","tags":["风景最美"],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["SWISS","easyJet","BA"],"duration_hours":1.75,"distance_km":780,"from_code":"LHR/LGW/LTN","to_code":"ZRH","notes":"SWISS 从 Heathrow 体验好"},
    {"from":"Zurich","to":"Visp","mode":"train","typical_carriers":["SBB"],"duration_hours":2,"distance_km":190,"notes":""},
    {"from":"Visp","to":"Zermatt","mode":"train","typical_carriers":["MGB"],"duration_hours":1,"distance_km":35,"notes":"最后一段风景绝美，Matterhorn 逐渐显现"}
  ]},
  {"id":"R3","name":"飞 Milan + 火车","name_en":"Fly Milan + train","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":["创意路线"],"legs":[
    {"from":"London","to":"Milan","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":2,"distance_km":960,"from_code":"LGW/STN","to_code":"MXP/BGY","notes":""},
    {"from":"Milan","to":"Brig","mode":"train","typical_carriers":["SBB / Trenitalia"],"duration_hours":2,"distance_km":130,"notes":"穿 Simplon 隧道进瑞士"},
    {"from":"Brig","to":"Zermatt","mode":"train","typical_carriers":["MGB"],"duration_hours":1.25,"distance_km":40,"notes":""}
  ]},
  {"id":"R4","name":"全程火车 London→Paris→Zermatt","name_en":"Eurostar + TGV + Swiss rail","total_duration_hours":10,"price_tier":"mid","complexity":"complex","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Lausanne","mode":"train","typical_carriers":["TGV Lyria"],"duration_hours":3.5,"distance_km":530,"notes":"TGV Lyria 法瑞高铁"},
    {"from":"Lausanne","to":"Visp","mode":"train","typical_carriers":["SBB"],"duration_hours":1.25,"distance_km":100,"notes":""},
    {"from":"Visp","to":"Zermatt","mode":"train","typical_carriers":["MGB"],"duration_hours":1,"distance_km":35,"notes":""}
  ]}
]},

"london::verbier": {"routes":[
  {"id":"R1","name":"飞 Geneva + 大巴直达","name_en":"Fly Geneva + bus","total_duration_hours":4,"price_tier":"budget","complexity":"simple","tags":["最快","最热门"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS","BA"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"Verbier","mode":"shuttle","typical_carriers":["AlpyBus","Verbier Express"],"duration_hours":2,"distance_km":150,"notes":"直达 shuttle 约 CHF 60-80"}
  ]},
  {"id":"R2","name":"飞 Geneva + 火车","name_en":"Fly Geneva + train","total_duration_hours":4.5,"price_tier":"mid","complexity":"moderate","tags":["风景最美"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva Airport","to":"Martigny","mode":"train","typical_carriers":["SBB"],"duration_hours":1.75,"distance_km":110,"notes":""},
    {"from":"Martigny","to":"Le Châble","mode":"train","typical_carriers":["SBB"],"duration_hours":0.5,"distance_km":15,"notes":""},
    {"from":"Le Châble","to":"Verbier","mode":"shuttle","typical_carriers":["PostBus","cable car"],"duration_hours":0.25,"distance_km":5,"notes":"缆车或 PostBus 上山"}
  ]},
  {"id":"R3","name":"全程火车","name_en":"Eurostar + TGV Lyria + Swiss rail","total_duration_hours":9,"price_tier":"mid","complexity":"complex","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Martigny","mode":"train","typical_carriers":["TGV Lyria"],"duration_hours":4.5,"distance_km":570,"notes":"经 Lausanne"},
    {"from":"Martigny","to":"Verbier","mode":"train","typical_carriers":["SBB + cable car"],"duration_hours":1,"distance_km":20,"notes":""}
  ]}
]},

"london::crans-montana": {"routes":[
  {"id":"R1","name":"飞 Geneva + 火车","name_en":"Fly Geneva + train","total_duration_hours":4.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva","to":"Sierre","mode":"train","typical_carriers":["SBB"],"duration_hours":2,"distance_km":130,"notes":""},
    {"from":"Sierre","to":"Crans-Montana","mode":"shuttle","typical_carriers":["funicular","PostBus"],"duration_hours":0.5,"distance_km":12,"notes":"SMC 缆车直上"}
  ]},
  {"id":"R2","name":"飞 Zurich + 火车","name_en":"Fly Zurich + train","total_duration_hours":5.5,"price_tier":"mid","complexity":"simple","tags":[],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["SWISS"],"duration_hours":1.75,"distance_km":780,"from_code":"LHR","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"Sierre","mode":"train","typical_carriers":["SBB"],"duration_hours":2.5,"distance_km":200,"notes":""},
    {"from":"Sierre","to":"Crans-Montana","mode":"shuttle","typical_carriers":["funicular"],"duration_hours":0.5,"distance_km":12,"notes":""}
  ]}
]},

"london::saas-fee": {"routes":[
  {"id":"R1","name":"飞 Geneva + 火车","name_en":"Fly Geneva + train + bus","total_duration_hours":5.5,"price_tier":"mid","complexity":"moderate","tags":["最快"],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet","SWISS"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW/LHR","to_code":"GVA","notes":""},
    {"from":"Geneva","to":"Visp","mode":"train","typical_carriers":["SBB"],"duration_hours":2,"distance_km":145,"notes":""},
    {"from":"Visp","to":"Saas-Fee","mode":"bus","typical_carriers":["PostBus"],"duration_hours":0.75,"distance_km":26,"notes":"无车村庄，停车场在村外"}
  ]},
  {"id":"R2","name":"飞 Zurich + 火车","name_en":"Fly Zurich + train","total_duration_hours":6,"price_tier":"mid","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["SWISS"],"duration_hours":1.75,"distance_km":780,"from_code":"LHR","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"Visp","mode":"train","typical_carriers":["SBB"],"duration_hours":2,"distance_km":190,"notes":""},
    {"from":"Visp","to":"Saas-Fee","mode":"bus","typical_carriers":["PostBus"],"duration_hours":0.75,"distance_km":26,"notes":""}
  ]}
]},

"london::wengen": {"routes":[
  {"id":"R1","name":"飞 Zurich + 火车直达","name_en":"Fly Zurich + train","total_duration_hours":5.5,"price_tier":"mid","complexity":"simple","tags":["最快","风景最美"],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["SWISS","easyJet"],"duration_hours":1.75,"distance_km":780,"from_code":"LHR/LGW","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"Interlaken Ost","mode":"train","typical_carriers":["SBB"],"duration_hours":2,"distance_km":120,"notes":""},
    {"from":"Interlaken","to":"Lauterbrunnen","mode":"train","typical_carriers":["BOB"],"duration_hours":0.5,"distance_km":20,"notes":""},
    {"from":"Lauterbrunnen","to":"Wengen","mode":"train","typical_carriers":["WAB cogwheel"],"duration_hours":0.25,"distance_km":4,"notes":"齿轨火车上山，无车村庄"}
  ]},
  {"id":"R2","name":"飞 Basel + 火车","name_en":"Fly Basel + train","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Basel","mode":"flight","typical_carriers":["easyJet","Wizz Air"],"duration_hours":1.5,"distance_km":700,"from_code":"LGW/LTN","to_code":"BSL","notes":"easyJet Gatwick"},
    {"from":"Basel","to":"Interlaken","mode":"train","typical_carriers":["SBB"],"duration_hours":2,"distance_km":130,"notes":"经 Bern"},
    {"from":"Interlaken","to":"Wengen","mode":"train","typical_carriers":["BOB + WAB"],"duration_hours":0.75,"distance_km":24,"notes":""}
  ]},
  {"id":"R3","name":"飞 Geneva + 火车","name_en":"Fly Geneva + train","total_duration_hours":6,"price_tier":"mid","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW","to_code":"GVA","notes":""},
    {"from":"Geneva","to":"Interlaken","mode":"train","typical_carriers":["SBB"],"duration_hours":2.75,"distance_km":200,"notes":"经 Bern"},
    {"from":"Interlaken","to":"Wengen","mode":"train","typical_carriers":["BOB + WAB"],"duration_hours":0.75,"distance_km":24,"notes":""}
  ]}
]},

"london::grindelwald": {"routes":[
  {"id":"R1","name":"飞 Zurich + 火车","name_en":"Fly Zurich + train","total_duration_hours":5,"price_tier":"mid","complexity":"simple","tags":["最快","风景最美"],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["SWISS","easyJet"],"duration_hours":1.75,"distance_km":780,"from_code":"LHR/LGW","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"Interlaken","mode":"train","typical_carriers":["SBB"],"duration_hours":2,"distance_km":120,"notes":""},
    {"from":"Interlaken","to":"Grindelwald","mode":"train","typical_carriers":["BOB"],"duration_hours":0.5,"distance_km":20,"notes":"Eiger 北壁越来越近"}
  ]},
  {"id":"R2","name":"飞 Basel + 火车","name_en":"Fly Basel + train","total_duration_hours":5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Basel","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.5,"distance_km":700,"from_code":"LGW","to_code":"BSL","notes":""},
    {"from":"Basel","to":"Interlaken","mode":"train","typical_carriers":["SBB"],"duration_hours":2,"distance_km":130,"notes":""},
    {"from":"Interlaken","to":"Grindelwald","mode":"train","typical_carriers":["BOB"],"duration_hours":0.5,"distance_km":20,"notes":""}
  ]},
  {"id":"R3","name":"飞 Geneva + 火车","name_en":"Fly Geneva + train","total_duration_hours":6,"price_tier":"mid","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Geneva","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW","to_code":"GVA","notes":""},
    {"from":"Geneva","to":"Interlaken","mode":"train","typical_carriers":["SBB"],"duration_hours":2.75,"distance_km":200,"notes":""},
    {"from":"Interlaken","to":"Grindelwald","mode":"train","typical_carriers":["BOB"],"duration_hours":0.5,"distance_km":20,"notes":""}
  ]}
]},

"london::st. moritz": {"routes":[
  {"id":"R1","name":"飞 Zurich + 火车（Glacier Express 线）","name_en":"Fly Zurich + rail","total_duration_hours":6,"price_tier":"mid","complexity":"simple","tags":["最快","风景最美"],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["SWISS","easyJet"],"duration_hours":1.75,"distance_km":780,"from_code":"LHR/LGW","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"Chur","mode":"train","typical_carriers":["SBB"],"duration_hours":1.25,"distance_km":120,"notes":""},
    {"from":"Chur","to":"St. Moritz","mode":"train","typical_carriers":["Rhaetian Railway (RhB)"],"duration_hours":2,"distance_km":90,"notes":"Albula 线，UNESCO 世遗铁路，翻越 Albula Pass"}
  ]},
  {"id":"R2","name":"飞 Milan + 火车经 Bernina","name_en":"Fly Milan + Bernina Express","total_duration_hours":6.5,"price_tier":"mid","complexity":"moderate","tags":["风景最美","创意路线"],"legs":[
    {"from":"London","to":"Milan","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":2,"distance_km":960,"from_code":"LGW/STN","to_code":"MXP/BGY","notes":""},
    {"from":"Milan","to":"Tirano","mode":"train","typical_carriers":["Trenord"],"duration_hours":2.5,"distance_km":150,"notes":""},
    {"from":"Tirano","to":"St. Moritz","mode":"train","typical_carriers":["Bernina Express (RhB)"],"duration_hours":2,"distance_km":60,"notes":"Bernina 线 UNESCO 世遗，翻越 2253m 山口，全欧最高铁路"}
  ]},
  {"id":"R3","name":"飞 Innsbruck + 火车","name_en":"Fly Innsbruck + rail","total_duration_hours":6,"price_tier":"mid","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet"],"duration_hours":2,"distance_km":1000,"from_code":"LGW","to_code":"INN","notes":""},
    {"from":"Innsbruck","to":"Landeck","mode":"train","typical_carriers":["ÖBB"],"duration_hours":1,"distance_km":75,"notes":""},
    {"from":"Landeck","to":"St. Moritz","mode":"train","typical_carriers":["RhB via Scuol"],"duration_hours":2.5,"distance_km":100,"notes":"经 Engadin Valley"}
  ]}
]},

"london::davos-klosters": {"routes":[
  {"id":"R1","name":"飞 Zurich + 火车直达","name_en":"Fly Zurich + train","total_duration_hours":5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["SWISS","easyJet"],"duration_hours":1.75,"distance_km":780,"from_code":"LHR/LGW","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"Davos","mode":"train","typical_carriers":["SBB + RhB"],"duration_hours":2.5,"distance_km":150,"notes":"经 Landquart 换窄轨"}
  ]},
  {"id":"R2","name":"飞 Zurich + 大巴","name_en":"Fly Zurich + bus","total_duration_hours":4.5,"price_tier":"budget","complexity":"simple","tags":["最便宜"],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.75,"distance_km":780,"from_code":"LGW","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"Davos","mode":"bus","typical_carriers":["FlixBus","PostBus"],"duration_hours":2.5,"distance_km":150,"notes":""}
  ]},
  {"id":"R3","name":"飞 Innsbruck + 火车","name_en":"Fly Innsbruck + rail","total_duration_hours":5.5,"price_tier":"mid","complexity":"moderate","tags":["创意路线"],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet"],"duration_hours":2,"distance_km":1000,"from_code":"LGW","to_code":"INN","notes":""},
    {"from":"Innsbruck","to":"Davos","mode":"train","typical_carriers":["ÖBB + RhB"],"duration_hours":3,"distance_km":140,"notes":"经 Landeck→Scuol→Klosters→Davos"}
  ]}
]},

"london::laax": {"routes":[
  {"id":"R1","name":"飞 Zurich + 火车+大巴","name_en":"Fly Zurich + train + bus","total_duration_hours":4.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["SWISS","easyJet"],"duration_hours":1.75,"distance_km":780,"from_code":"LHR/LGW","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"Chur","mode":"train","typical_carriers":["SBB"],"duration_hours":1.25,"distance_km":120,"notes":""},
    {"from":"Chur","to":"Laax","mode":"bus","typical_carriers":["PostBus"],"duration_hours":0.5,"distance_km":25,"notes":"Chur 到 Laax 很近"}
  ]},
  {"id":"R2","name":"飞 Zurich + 直达大巴","name_en":"Fly Zurich + direct bus","total_duration_hours":4,"price_tier":"budget","complexity":"simple","tags":["最便宜"],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.75,"distance_km":780,"from_code":"LGW","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"Laax","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":1.75,"distance_km":130,"notes":"冬季有直达 shuttle"}
  ]}
]},

"london::andermatt": {"routes":[
  {"id":"R1","name":"飞 Zurich + 火车","name_en":"Fly Zurich + train","total_duration_hours":4.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["SWISS","easyJet"],"duration_hours":1.75,"distance_km":780,"from_code":"LHR/LGW","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"Göschenen","mode":"train","typical_carriers":["SBB"],"duration_hours":1.75,"distance_km":100,"notes":""},
    {"from":"Göschenen","to":"Andermatt","mode":"train","typical_carriers":["MGB"],"duration_hours":0.2,"distance_km":5,"notes":"Schöllen 峡谷短途火车"}
  ]},
  {"id":"R2","name":"飞 Milan + 火车穿 Gotthard","name_en":"Fly Milan + Gotthard route","total_duration_hours":5.5,"price_tier":"mid","complexity":"moderate","tags":["创意路线"],"legs":[
    {"from":"London","to":"Milan","mode":"flight","typical_carriers":["easyJet"],"duration_hours":2,"distance_km":960,"from_code":"LGW","to_code":"MXP","notes":""},
    {"from":"Milan","to":"Göschenen","mode":"train","typical_carriers":["SBB / Trenitalia"],"duration_hours":2.5,"distance_km":180,"notes":"穿 Gotthard Base Tunnel（世界最长铁路隧道 57km）"},
    {"from":"Göschenen","to":"Andermatt","mode":"train","typical_carriers":["MGB"],"duration_hours":0.2,"distance_km":5,"notes":""}
  ]}
]},


"london::st. anton am arlberg": {"routes":[
  {"id":"R1","name":"飞 Innsbruck + 火车直达","name_en":"Fly Innsbruck + train","total_duration_hours":4,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet","BA"],"duration_hours":2,"distance_km":1000,"from_code":"LGW/LHR","to_code":"INN","notes":"easyJet Gatwick 直飞"},
    {"from":"Innsbruck","to":"St. Anton","mode":"train","typical_carriers":["ÖBB"],"duration_hours":1.25,"distance_km":100,"notes":"ÖBB 火车直达 St. Anton 站，下车即雪场"}
  ]},
  {"id":"R2","name":"飞 Zurich + 火车","name_en":"Fly Zurich + train","total_duration_hours":5.5,"price_tier":"mid","complexity":"simple","tags":["风景最美"],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["SWISS","easyJet"],"duration_hours":1.75,"distance_km":780,"from_code":"LHR/LGW","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"St. Anton","mode":"train","typical_carriers":["ÖBB Railjet"],"duration_hours":3.25,"distance_km":200,"notes":"经 Feldkirch→Bludenz→Arlberg"}
  ]},
  {"id":"R3","name":"飞 Munich + 火车","name_en":"Fly Munich + train","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Munich","mode":"flight","typical_carriers":["easyJet","Ryanair","Lufthansa"],"duration_hours":2,"distance_km":920,"from_code":"LGW/STN/LHR","to_code":"MUC","notes":""},
    {"from":"Munich","to":"St. Anton","mode":"train","typical_carriers":["ÖBB","DB"],"duration_hours":3,"distance_km":190,"notes":"经 Garmisch 或 Innsbruck"}
  ]},
  {"id":"R4","name":"飞 Friedrichshafen 廉航 + 大巴","name_en":"Fly Friedrichshafen + bus","total_duration_hours":5,"price_tier":"budget","complexity":"moderate","tags":["创意路线"],"legs":[
    {"from":"London","to":"Friedrichshafen","mode":"flight","typical_carriers":["Ryanair"],"duration_hours":1.75,"distance_km":800,"from_code":"STN","to_code":"FDH","notes":"Ryanair 冬季航线"},
    {"from":"Friedrichshafen","to":"St. Anton","mode":"bus","typical_carriers":["FlixBus","ÖBB bus"],"duration_hours":2.5,"distance_km":140,"notes":"经 Bregenz→Bludenz→Arlberg"}
  ]},
  {"id":"R5","name":"全程火车经 Paris + Zurich","name_en":"Eurostar + TGV + rail","total_duration_hours":11,"price_tier":"mid","complexity":"complex","tags":["纯火车"],"legs":[
    {"from":"London","to":"Paris","mode":"train","typical_carriers":["Eurostar"],"duration_hours":2.25,"distance_km":460,"notes":""},
    {"from":"Paris","to":"Zurich","mode":"train","typical_carriers":["TGV Lyria"],"duration_hours":4,"distance_km":600,"notes":""},
    {"from":"Zurich","to":"St. Anton","mode":"train","typical_carriers":["ÖBB"],"duration_hours":3.25,"distance_km":200,"notes":""}
  ]}
]},

"london::lech-zürs": {"routes":[
  {"id":"R1","name":"飞 Innsbruck + 大巴","name_en":"Fly Innsbruck + bus","total_duration_hours":4.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet","BA"],"duration_hours":2,"distance_km":1000,"from_code":"LGW/LHR","to_code":"INN","notes":""},
    {"from":"Innsbruck","to":"Lech","mode":"bus","typical_carriers":["ÖBB bus","Arlberg shuttle"],"duration_hours":2,"distance_km":110,"notes":"经 St. Anton→Flexen Pass 到 Lech"}
  ]},
  {"id":"R2","name":"飞 Zurich + 火车+大巴","name_en":"Fly Zurich + train + bus","total_duration_hours":6,"price_tier":"mid","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["SWISS"],"duration_hours":1.75,"distance_km":780,"from_code":"LHR","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"Langen am Arlberg","mode":"train","typical_carriers":["ÖBB"],"duration_hours":3,"distance_km":190,"notes":""},
    {"from":"Langen","to":"Lech","mode":"bus","typical_carriers":["ÖBB bus"],"duration_hours":0.5,"distance_km":15,"notes":""}
  ]},
  {"id":"R3","name":"飞 Friedrichshafen + 大巴","name_en":"Fly Friedrichshafen","total_duration_hours":4.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Friedrichshafen","mode":"flight","typical_carriers":["Ryanair"],"duration_hours":1.75,"distance_km":800,"from_code":"STN","to_code":"FDH","notes":""},
    {"from":"Friedrichshafen","to":"Lech","mode":"bus","typical_carriers":["shuttle"],"duration_hours":2.25,"distance_km":120,"notes":"经 Bregenz"}
  ]}
]},

"london::kitzbühel": {"routes":[
  {"id":"R1","name":"飞 Innsbruck + 火车直达","name_en":"Fly Innsbruck + train","total_duration_hours":3.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet","BA"],"duration_hours":2,"distance_km":1000,"from_code":"LGW/LHR","to_code":"INN","notes":""},
    {"from":"Innsbruck","to":"Kitzbühel","mode":"train","typical_carriers":["ÖBB"],"duration_hours":1,"distance_km":95,"notes":"ÖBB 直达，Kitzbühel 站就在镇中心"}
  ]},
  {"id":"R2","name":"飞 Salzburg + 火车","name_en":"Fly Salzburg + train","total_duration_hours":4.5,"price_tier":"mid","complexity":"simple","tags":[],"legs":[
    {"from":"London","to":"Salzburg","mode":"flight","typical_carriers":["easyJet","Ryanair","Wizz Air"],"duration_hours":2,"distance_km":1000,"from_code":"LGW/STN/LTN","to_code":"SZG","notes":""},
    {"from":"Salzburg","to":"Kitzbühel","mode":"train","typical_carriers":["ÖBB"],"duration_hours":2,"distance_km":80,"notes":"经 Wörgl"}
  ]},
  {"id":"R3","name":"飞 Munich + 火车","name_en":"Fly Munich + train","total_duration_hours":5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Munich","mode":"flight","typical_carriers":["easyJet","Ryanair","Lufthansa"],"duration_hours":2,"distance_km":920,"from_code":"LGW/STN/LHR","to_code":"MUC","notes":""},
    {"from":"Munich","to":"Kitzbühel","mode":"train","typical_carriers":["ÖBB","DB"],"duration_hours":2.5,"distance_km":140,"notes":"经 Kufstein→Wörgl"}
  ]}
]},

"london::ischgl": {"routes":[
  {"id":"R1","name":"飞 Innsbruck + 大巴","name_en":"Fly Innsbruck + bus","total_duration_hours":4.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet","BA"],"duration_hours":2,"distance_km":1000,"from_code":"LGW/LHR","to_code":"INN","notes":""},
    {"from":"Innsbruck","to":"Ischgl","mode":"bus","typical_carriers":["ÖBB bus","shuttle"],"duration_hours":2,"distance_km":100,"notes":"经 Landeck→Paznaun Valley"}
  ]},
  {"id":"R2","name":"飞 Zurich + 火车+大巴","name_en":"Fly Zurich + train + bus","total_duration_hours":5.5,"price_tier":"mid","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Zurich","mode":"flight","typical_carriers":["SWISS"],"duration_hours":1.75,"distance_km":780,"from_code":"LHR","to_code":"ZRH","notes":""},
    {"from":"Zurich","to":"Landeck","mode":"train","typical_carriers":["ÖBB"],"duration_hours":2.5,"distance_km":180,"notes":""},
    {"from":"Landeck","to":"Ischgl","mode":"bus","typical_carriers":["ÖBB bus"],"duration_hours":0.75,"distance_km":35,"notes":""}
  ]},
  {"id":"R3","name":"飞 Munich + 大巴","name_en":"Fly Munich + bus","total_duration_hours":6,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Munich","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":2,"distance_km":920,"from_code":"LGW/STN","to_code":"MUC","notes":""},
    {"from":"Munich","to":"Ischgl","mode":"bus","typical_carriers":["FlixBus","shuttle"],"duration_hours":3.5,"distance_km":230,"notes":"经 Innsbruck→Landeck"}
  ]}
]},

"london::sölden": {"routes":[
  {"id":"R1","name":"飞 Innsbruck + 大巴直达","name_en":"Fly Innsbruck + bus","total_duration_hours":3.5,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet","BA"],"duration_hours":2,"distance_km":1000,"from_code":"LGW/LHR","to_code":"INN","notes":""},
    {"from":"Innsbruck","to":"Sölden","mode":"bus","typical_carriers":["ÖBB bus","Ötztal shuttle"],"duration_hours":1.25,"distance_km":85,"notes":"Innsbruck 到 Sölden 很近，Ötztal Valley 直上"}
  ]},
  {"id":"R2","name":"飞 Munich + 大巴","name_en":"Fly Munich + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Munich","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":2,"distance_km":920,"from_code":"LGW/STN","to_code":"MUC","notes":""},
    {"from":"Munich","to":"Sölden","mode":"bus","typical_carriers":["FlixBus"],"duration_hours":3,"distance_km":200,"notes":"经 Garmisch 或 Innsbruck"}
  ]}
]},

"london::mayrhofen": {"routes":[
  {"id":"R1","name":"飞 Innsbruck + 火车","name_en":"Fly Innsbruck + train","total_duration_hours":4,"price_tier":"mid","complexity":"simple","tags":["最快"],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet","BA"],"duration_hours":2,"distance_km":1000,"from_code":"LGW/LHR","to_code":"INN","notes":""},
    {"from":"Innsbruck","to":"Jenbach","mode":"train","typical_carriers":["ÖBB"],"duration_hours":0.5,"distance_km":40,"notes":""},
    {"from":"Jenbach","to":"Mayrhofen","mode":"train","typical_carriers":["Zillertalbahn"],"duration_hours":1,"distance_km":30,"notes":"Zillertal 窄轨小火车，沿河谷进山"}
  ]},
  {"id":"R2","name":"飞 Munich + 火车","name_en":"Fly Munich + train","total_duration_hours":5,"price_tier":"budget","complexity":"moderate","tags":["最便宜"],"legs":[
    {"from":"London","to":"Munich","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":2,"distance_km":920,"from_code":"LGW/STN","to_code":"MUC","notes":""},
    {"from":"Munich","to":"Jenbach","mode":"train","typical_carriers":["ÖBB"],"duration_hours":1.5,"distance_km":130,"notes":""},
    {"from":"Jenbach","to":"Mayrhofen","mode":"train","typical_carriers":["Zillertalbahn"],"duration_hours":1,"distance_km":30,"notes":""}
  ]},
  {"id":"R3","name":"飞 Salzburg + 大巴","name_en":"Fly Salzburg + bus","total_duration_hours":5,"price_tier":"budget","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Salzburg","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":2,"distance_km":1000,"from_code":"LGW/STN","to_code":"SZG","notes":""},
    {"from":"Salzburg","to":"Mayrhofen","mode":"bus","typical_carriers":["FlixBus","shuttle"],"duration_hours":2.5,"distance_km":155,"notes":""}
  ]}
]},

"london::saalbach-hinterglemm": {"routes":[
  {"id":"R1","name":"飞 Salzburg + 大巴","name_en":"Fly Salzburg + bus","total_duration_hours":4,"price_tier":"budget","complexity":"simple","tags":["最快","最便宜"],"legs":[
    {"from":"London","to":"Salzburg","mode":"flight","typical_carriers":["easyJet","Ryanair","Wizz Air"],"duration_hours":2,"distance_km":1000,"from_code":"LGW/STN/LTN","to_code":"SZG","notes":"easyJet Gatwick 直飞"},
    {"from":"Salzburg","to":"Saalbach","mode":"bus","typical_carriers":["PostBus","shuttle"],"duration_hours":1.5,"distance_km":80,"notes":"经 Zell am See→Saalbach"}
  ]},
  {"id":"R2","name":"飞 Innsbruck + 火车+大巴","name_en":"Fly Innsbruck + train + bus","total_duration_hours":5,"price_tier":"mid","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Innsbruck","mode":"flight","typical_carriers":["easyJet"],"duration_hours":2,"distance_km":1000,"from_code":"LGW","to_code":"INN","notes":""},
    {"from":"Innsbruck","to":"Zell am See","mode":"train","typical_carriers":["ÖBB"],"duration_hours":2,"distance_km":145,"notes":""},
    {"from":"Zell am See","to":"Saalbach","mode":"bus","typical_carriers":["PostBus"],"duration_hours":0.5,"distance_km":20,"notes":""}
  ]},
  {"id":"R3","name":"飞 Munich + 火车+大巴","name_en":"Fly Munich + train + bus","total_duration_hours":5.5,"price_tier":"budget","complexity":"moderate","tags":[],"legs":[
    {"from":"London","to":"Munich","mode":"flight","typical_carriers":["easyJet","Ryanair"],"duration_hours":2,"distance_km":920,"from_code":"LGW/STN","to_code":"MUC","notes":""},
    {"from":"Munich","to":"Zell am See","mode":"train","typical_carriers":["ÖBB"],"duration_hours":2.5,"distance_km":180,"notes":""},
    {"from":"Zell am See","to":"Saalbach","mode":"bus","typical_carriers":["PostBus"],"duration_hours":0.5,"distance_km":20,"notes":""}
  ]}
]}

};

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

const RESORTS = [
  { country: "France", flag: "🇫🇷", resorts: ["Chamonix-Mont-Blanc","Val d'Isère","Tignes","Courchevel","Méribel","Val Thorens","La Plagne","Les Arcs","Alpe d'Huez","Les Deux Alpes","Morzine","Avoriaz","Les Gets","Flaine","Megève","La Clusaz","Serre Chevalier","La Rosière"] },
  { country: "Italy", flag: "🇮🇹", resorts: ["Cortina d'Ampezzo","Val Gardena (Selva)","Alta Badia","Cervinia","Courmayeur","La Thuile","Livigno","Madonna di Campiglio"] },
  { country: "Switzerland", flag: "🇨🇭", resorts: ["Zermatt","Verbier","Crans-Montana","Saas-Fee","Wengen","Grindelwald","St. Moritz","Davos-Klosters","Laax","Andermatt"] },
  { country: "Austria", flag: "🇦🇹", resorts: ["St. Anton am Arlberg","Lech-Zürs","Kitzbühel","Ischgl","Sölden","Mayrhofen","Saalbach-Hinterglemm"] }
];

const MODE_ICONS = { flight: "✈️", train: "🚆", bus: "🚌", shuttle: "🚐", car: "🚗", ferry: "⛴️", cable_car: "🚡", walk: "🚶" };
const MODE_ZH = { flight: "飞行", train: "火车", bus: "巴士", shuttle: "接驳车", car: "自驾", ferry: "渡轮", cable_car: "缆车", walk: "步行" };
const TIER_COLORS = { budget: "#34d399", mid: "#fbbf24", premium: "#f87171" };
const TIER_LABELS = { budget: "💰 经济", mid: "💎 中档", premium: "👑 高端" };
const COMPLEXITY_LABELS = { simple: "简单", moderate: "适中", complex: "复杂" };
const BG = "#0c1220";
const CARD_BG = "#151d2e";
const CARD_BORDER = "#1e2d45";
const ACCENT = "#38bdf8";
const TEXT1 = "#f1f5f9";
const TEXT2 = "#94a3b8";
const TEXT3 = "#64748b";
const FONT = "'DM Sans', 'Segoe UI', system-ui, sans-serif";

/* ═══════════════════════════════════════════════
   CACHE + API LOGIC
   ═══════════════════════════════════════════════ */

const dynamicCache = {};

function cacheKey(origin, resort) {
  return `${origin.trim().toLowerCase()}::${resort.trim().toLowerCase()}`;
}

const SYSTEM_PROMPT = `You are a European ski travel route planner. Given an origin city and a ski resort, generate ALL viable multi-modal transport routes.
RULES:
- Generate 5-8 routes with flights, trains, buses, shuttles, creative combos
- Include budget (Ryanair, easyJet, FlixBus) and premium (BA, SWISS, Eurostar)
- Route names in Chinese describing HOW you travel, not carrier names
- Do NOT invent prices, categorize as budget/mid/premium
- Include Eurostar Snow train if relevant (London→Lille→Alps, Saturdays Dec-Mar)
Respond ONLY valid JSON: {"routes":[{"id":"R1","name":"...","name_en":"...","total_duration_hours":3.5,"price_tier":"budget","complexity":"simple","tags":["最快"],"legs":[{"from":"...","to":"...","mode":"flight","typical_carriers":["easyJet"],"duration_hours":1.5,"distance_km":750,"from_code":"LGW","to_code":"GVA","notes":"..."}]}]}
TAGS: 最快, 最便宜, 最热门, 最舒适, 风景最美, 夜车省住宿, 纯火车, 仅限冬季, 需要转车多, 创意路线`;

async function fetchRoutesFromAPI(origin, resort, signal) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Origin: ${origin}\nDestination: ${resort}\nGenerate all viable routes. Chinese names. JSON only.` }]
    })
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  const data = await response.json();
  const text = data.content.map(b => b.text || "").join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function getRoutes(origin, resort, signal) {
  const key = cacheKey(origin, resort);
  // 1. Check pre-generated cache
  if (ROUTES_CACHE[key]) return { routes: ROUTES_CACHE[key].routes, source: "预生成" };
  // 2. Check dynamic cache
  if (dynamicCache[key]) return { routes: dynamicCache[key].routes, source: "已缓存" };
  // 3. Call API
  const data = await fetchRoutesFromAPI(origin, resort, signal);
  dynamicCache[key] = data;
  return { routes: data.routes || [], source: "实时生成" };
}

/* ═══════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════ */

function ResortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const groups = useMemo(() => {
    if (!q) return RESORTS;
    const s = q.toLowerCase();
    return RESORTS.map(g => ({
      ...g,
      resorts: g.resorts.filter(r => r.toLowerCase().includes(s) || g.country.toLowerCase().includes(s))
    })).filter(g => g.resorts.length > 0);
  }, [q]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <label style={{ fontSize: 12, color: TEXT2, marginBottom: 6, display: "block", fontWeight: 500, letterSpacing: 0.5, textTransform: "uppercase" }}>🎿 滑雪场</label>
      <div onClick={() => setOpen(!open)} style={{
        padding: "12px 16px", borderRadius: 10, border: `1px solid ${open ? ACCENT : CARD_BORDER}`,
        background: CARD_BG, color: value ? TEXT1 : TEXT3, cursor: "pointer", fontSize: 15,
        display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.2s"
      }}>
        <span>{value || "选择目的地..."}</span>
        <span style={{ fontSize: 10, color: TEXT3 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 12,
          maxHeight: 340, overflowY: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.6)"
        }}>
          <div style={{ padding: 8, position: "sticky", top: 0, background: CARD_BG, zIndex: 2 }}>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="搜索雪场或国家..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${CARD_BORDER}`,
                background: BG, color: TEXT1, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = CARD_BORDER} />
          </div>
          {groups.map(g => (
            <div key={g.country}>
              <div style={{ padding: "8px 16px", fontSize: 11, color: TEXT2, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
                {g.flag} {g.country} ({g.resorts.length})
              </div>
              {g.resorts.map(r => (
                <div key={r} onClick={() => { onChange(r); setOpen(false); setQ(""); }}
                  style={{ padding: "9px 16px 9px 34px", cursor: "pointer", fontSize: 14,
                    color: r === value ? ACCENT : TEXT1,
                    background: r === value ? ACCENT+"10" : "transparent", transition: "background 0.1s" }}
                  onMouseEnter={e => { if (r !== value) e.currentTarget.style.background = ACCENT+"0a"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = r === value ? ACCENT+"10" : "transparent"; }}>
                  {r}
                </div>
              ))}
            </div>
          ))}
          {groups.length === 0 && <div style={{ padding: 20, textAlign: "center", color: TEXT3, fontSize: 14 }}>没有匹配</div>}
        </div>
      )}
    </div>
  );
}

function LegTimeline({ legs }) {
  return (
    <div style={{ padding: "16px 0 4px" }}>
      {legs.map((leg, i) => (
        <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < legs.length - 1 ? 18 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 36 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: ACCENT+"18", fontSize: 17, flexShrink: 0 }}>
              {MODE_ICONS[leg.mode] || "🚀"}
            </div>
            {i < legs.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 24, background: CARD_BORDER, marginTop: 6 }} />}
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT1 }}>
              {leg.from} → {leg.to}
              {leg.from_code && leg.to_code && <span style={{ fontSize: 12, color: TEXT3, fontWeight: 400, marginLeft: 8 }}>{leg.from_code} → {leg.to_code}</span>}
            </div>
            <div style={{ fontSize: 13, color: TEXT2, marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span>{MODE_ZH[leg.mode] || leg.mode}</span>
              <span style={{ color: TEXT3 }}>·</span>
              <span>{leg.duration_hours}h</span>
              {leg.distance_km > 0 && <><span style={{ color: TEXT3 }}>·</span><span>{leg.distance_km}km</span></>}
            </div>
            {leg.typical_carriers?.length > 0 && <div style={{ fontSize: 12, color: TEXT3, marginTop: 3 }}>{leg.typical_carriers.join(" / ")}</div>}
            {leg.notes && (
              <div style={{ fontSize: 12, color: ACCENT, marginTop: 6, padding: "6px 10px", background: ACCENT+"08", borderRadius: 8, lineHeight: 1.5, borderLeft: `2px solid ${ACCENT}40` }}>
                {leg.notes}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RouteCard({ route, selected, onToggle, expanded, onExpand }) {
  const tierColor = TIER_COLORS[route.price_tier] || TEXT3;
  const legs = route.legs || [];
  const cityChain = legs.map((leg, i) => {
    const icon = MODE_ICONS[leg.mode] || "→";
    return i === 0 ? `${leg.from} ―${icon}― ${leg.to}` : ` ―${icon}― ${leg.to}`;
  }).join("");

  return (
    <div style={{
      background: selected ? ACCENT+"08" : CARD_BG,
      border: `1px solid ${selected ? ACCENT : CARD_BORDER}`,
      borderRadius: 14, overflow: "hidden", transition: "all 0.2s ease"
    }}>
      <div onClick={onExpand} style={{ padding: "16px 18px", cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: TEXT1 }}>{route.name}</span>
              {route.tags?.map(tag => (
                <span key={tag} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600, background: ACCENT+"15", color: ACCENT, letterSpacing: 0.3 }}>{tag}</span>
              ))}
            </div>
            {route.name_en && <div style={{ fontSize: 12, color: TEXT3, marginTop: 2 }}>{route.name_en}</div>}
            <div style={{ fontSize: 13, color: TEXT2, marginTop: 8, lineHeight: 1.5, wordBreak: "break-word" }}>{cityChain}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: TEXT1, fontVariantNumeric: "tabular-nums" }}>{route.total_duration_hours}h</div>
              <div style={{ display: "flex", gap: 5, marginTop: 5, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 5, fontWeight: 500, background: tierColor+"18", color: tierColor }}>{TIER_LABELS[route.price_tier] || route.price_tier}</span>
                <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 5, background: TEXT3+"15", color: TEXT3 }}>{COMPLEXITY_LABELS[route.complexity] || route.complexity}</span>
              </div>
            </div>
            <div onClick={e => { e.stopPropagation(); onToggle(); }}
              style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${selected ? ACCENT : "#334155"}`,
                background: selected ? ACCENT : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
              {selected && <span style={{ color: BG, fontSize: 14, fontWeight: 800 }}>✓</span>}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span style={{ fontSize: 10, color: TEXT3 }}>{expanded ? "▲ 收起详情" : "▼ 展开详情"}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${CARD_BORDER}` }}>
          <LegTimeline legs={legs} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════ */

export default function SkiRoutePlanner() {
  const [origin, setOrigin] = useState("London");
  const [resort, setResort] = useState("");
  const [routes, setRoutes] = useState(null);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState({});
  const abortRef = useRef(null);

  const canSearch = origin.trim().length > 1 && resort;

  const handleSearch = useCallback(async () => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setRoutes(null);
    setExpanded({});
    setSelected({});
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const { routes: r, source: s } = await getRoutes(origin.trim(), resort, ctrl.signal);
      setRoutes(r);
      setSource(s);
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [origin, resort, canSearch]);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div style={{ fontFamily: FONT, background: BG, minHeight: "100vh", color: TEXT1, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${CARD_BG} 0%, #0f1729 100%)`, borderBottom: `1px solid ${CARD_BORDER}`, padding: "24px 20px 20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 28 }}>⛷️</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Ski Route Planner</div>
              <div style={{ fontSize: 12, color: TEXT3 }}>AI 驱动 · 43 个顶级欧洲滑雪场 · 4 国覆盖</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: TEXT2, marginBottom: 6, display: "block", fontWeight: 500, letterSpacing: 0.5, textTransform: "uppercase" }}>📍 出发城市</label>
              <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="London, Manchester, Dublin..."
                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${CARD_BORDER}`,
                  background: CARD_BG, color: TEXT1, fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = ACCENT}
                onBlur={e => e.target.style.borderColor = CARD_BORDER} />
            </div>
            <ResortDropdown value={resort} onChange={setResort} />
            <button onClick={handleSearch} disabled={!canSearch || loading}
              style={{ padding: "14px", borderRadius: 10, border: "none", fontSize: 15, fontWeight: 700,
                background: canSearch && !loading ? `linear-gradient(135deg, ${ACCENT}, #0ea5e9)` : CARD_BORDER,
                color: canSearch && !loading ? BG : TEXT3, cursor: canSearch && !loading ? "pointer" : "not-allowed",
                transition: "all 0.2s", letterSpacing: 0.3, fontFamily: FONT }}>
              {loading ? "⏳ 生成中..." : "🔍 查找所有路线"}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, maxWidth: 600, margin: "0 auto", width: "100%", padding: "20px 16px 120px" }}>
        {error && (
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "#7f1d1d30", border: "1px solid #991b1b50", color: "#fca5a5", fontSize: 13, marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", gap: 16 }}>
            <style>{"@keyframes sk-spin { to { transform: rotate(360deg); } }"}</style>
            <div style={{ width: 44, height: 44, border: `3px solid ${CARD_BORDER}`, borderTopColor: ACCENT, borderRadius: "50%", animation: "sk-spin 0.8s linear infinite" }} />
            <div style={{ color: TEXT2, fontSize: 14 }}>正在生成路线方案...</div>
            <div style={{ color: TEXT3, fontSize: 12 }}>Claude 正在分析所有交通组合（非缓存城市需 15-20 秒）</div>
          </div>
        )}
        {!loading && !routes && !error && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏔️</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: TEXT1, marginBottom: 8 }}>选择出发城市和滑雪场</div>
            <div style={{ fontSize: 14, color: TEXT3, lineHeight: 1.6 }}>
              London 出发已预生成全部 43 个雪场路线（秒出）<br/>
              其他城市首次查询需调用 AI 实时生成
            </div>
          </div>
        )}
        {routes && routes.length > 0 && (
          <>
            <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: TEXT1 }}>{origin} → {resort}</span>
                <span style={{ fontSize: 13, color: TEXT3, marginLeft: 8 }}>{routes.length} 条路线</span>
              </div>
              <span style={{ fontSize: 11, color: source === "预生成" ? "#34d399" : source === "已缓存" ? ACCENT : "#fbbf24",
                background: (source === "预生成" ? "#34d399" : source === "已缓存" ? ACCENT : "#fbbf24") + "15",
                padding: "3px 8px", borderRadius: 6 }}>{source}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {routes.map(route => (
                <RouteCard key={route.id} route={route}
                  selected={!!selected[route.id]} onToggle={() => setSelected(p => ({ ...p, [route.id]: !p[route.id] }))}
                  expanded={!!expanded[route.id]} onExpand={() => setExpanded(p => ({ ...p, [route.id]: !p[route.id] }))} />
              ))}
            </div>
          </>
        )}
        {routes && routes.length === 0 && <div style={{ textAlign: "center", padding: 40, color: TEXT3 }}>没有找到路线</div>}
      </div>

      {selectedCount > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 20px",
          background: `linear-gradient(0deg, ${BG} 60%, transparent)`, display: "flex", justifyContent: "center", zIndex: 50 }}>
          <button style={{ padding: "14px 32px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: 700,
            background: `linear-gradient(135deg, ${ACCENT}, #0ea5e9)`, color: BG, cursor: "pointer", fontFamily: FONT,
            boxShadow: `0 4px 20px ${ACCENT}40`, maxWidth: 600, width: "100%" }}>
            🔎 查询 {selectedCount} 条路线的实时价格 →
          </button>
        </div>
      )}
    </div>
  );
}
