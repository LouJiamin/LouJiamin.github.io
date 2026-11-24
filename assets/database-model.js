(function(root,factory){const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.Week10Model=m;})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const categories=['数码产品','书籍','办公用品','生活用品'];
  const prices=[399,48,120,1999,65,699,89,1688,259,39,899,128,199,55,329,79,499,1099,168,29,2199,119,59,749,349,88,1599,45,299,999,69,189,579,36,1399,99,449,2399,76,269,649,49,179,1299,98,359,799,58];
  const records=prices.map((Price,i)=>({PID:'P'+String(i+1).padStart(3,'0'),PName:'商品'+String(i+1).padStart(2,'0'),Price,Category:categories[(i*3+1)%4],Page:Math.floor(i/4)+1,Slot:i%4+1}));
  const pages=Array.from({length:12},(_,i)=>({Page:i+1,records:records.filter(r=>r.Page===i+1)}));
  const denseIndex=records.slice().sort((a,b)=>a.PID.localeCompare(b.PID)).map(r=>({Key:r.PID,Pointer:'D'+String(r.Page).padStart(2,'0')+':'+r.Slot,Page:r.Page}));
  const sparseIndex=pages.map(p=>({Key:p.records[0].PID,Pointer:'D'+String(p.Page).padStart(2,'0'),Page:p.Page}));
  function scan(target,through){const t=records.find(r=>r.PID===target);const n=through==null?t.Page:Math.min(12,through);return {target:t,pages:pages.slice(0,n),found:n>=t.Page};}
  function indexLookup(target){const indexPage=target<'P025'?'I01':'I02';const item=denseIndex.find(x=>x.Key===target);return {indexPages:['ROOT',indexPage],dataPage:item.Page,pointer:item.Pointer,target:records.find(r=>r.PID===target)};}
  function categoryIndex(category){const matches=records.filter(r=>r.Category===category);return {category,pointers:matches.map(r=>({PID:r.PID,Page:r.Page,Slot:r.Slot})),dataPages:[...new Set(matches.map(r=>r.Page))]};}
  function cost(selectivity,covering){
    const seq={plan:'全表扫描',dataPages:100,indexPages:0,cost:100};
    if(covering){const leaves=Math.max(1,Math.ceil(selectivity*10));return {seq,index:{plan:'覆盖索引扫描',dataPages:0,indexPages:3+leaves,cost:3+leaves},choice:'index'};}
    const dataPages=Math.min(100,Math.ceil(selectivity*200));
    const idx={plan:'索引后回表',dataPages,indexPages:3,cost:3+dataPages*4};
    return {seq,index:idx,choice:idx.cost<seq.cost?'index':'seq'};
  }
  function lru(sequence,capacity){
    const cache=[],steps=[];
    sequence.forEach(page=>{
      const hit=cache.includes(page);let evicted=null;
      if(hit)cache.splice(cache.indexOf(page),1);
      else if(cache.length>=capacity)evicted=cache.shift();
      cache.push(page);steps.push({page,hit,evicted,cache:[...cache]});
    });
    return steps;
  }
  const plans={
    pid:{sql:"SELECT * FROM Products WHERE PID='P037';",access:'Index Scan',index:'idx_products_pid',rows:1,reason:'PID等值条件选择性高，索引可直接定位少量记录。'},
    category:{sql:"SELECT * FROM Products WHERE Category='数码产品';",access:'Seq Scan',index:null,rows:120000,reason:'类别命中大量记录，逐个回表的随机访问可能比连续读全表更贵。'},
    function:{sql:"SELECT * FROM Products WHERE LOWER(PName)='商品37';",access:'Seq Scan',index:null,rows:1,reason:'普通PName索引保存原值；对列计算LOWER后，不能直接按原索引键查找。'},
    range:{sql:'SELECT PID, Price FROM Products WHERE Price BETWEEN 100 AND 120;',access:'Index Only Scan',index:'idx_products_price_pid',rows:680,reason:'组合索引包含筛选列和输出列，可以在索引中完成本例查询。'}
  };
  const questions=[
    {title:'一张表有100个数据页，目标记录在第73页。没有可用索引时，最坏情况要读取多少页？',options:[
      ['1页，因为WHERE只返回一行',false,'结果行数不等于寻找结果需要读取的页数。'],
      ['73页或更多，需要逐页检查直到找到并确认',true,'正确。若还要确认没有其他匹配，可能继续读完整表。'],
      ['约7页，因为数据库默认抽样10%',false,'普通精确查询不能用抽样代替完整判断。'],
      ['只读系统目录，不读数据页',false,'目录告诉表与索引信息，不包含所有商品记录。']
    ]},
    {title:'稀疏索引为什么要求数据文件按索引键有序？',options:[
      ['因为每条记录都有一项索引',false,'这是稠密索引的特点。'],
      ['索引只给出块入口，要靠有序范围推断目标落在哪个块',true,'正确。若记录无序，缺失的键无法由相邻入口推断位置。'],
      ['有序后就不需要读取任何数据页',false,'索引定位后通常还要进入数据页找记录。'],
      ['有序文件禁止INSERT，所以索引永不维护',false,'可以插入，但维持顺序可能产生迁移或溢出块。']
    ]},
    {title:'Category辅助索引找到12个指针，分散在10个数据页。查询SELECT *大致还要做什么？',options:[
      ['只读一个索引项就返回12条完整记录',false,'索引项通常只有键与指针，不含SELECT *需要的全部列。'],
      ['按指针访问相应数据页，可能产生多次随机I/O',true,'正确。命中很多且分散时，回表成本会上升。'],
      ['把12条基本表记录永久移动到一起',false,'辅助索引不决定基本表记录位置。'],
      ['自动删除重复Category值',false,'重复键通过多个指针或指针桶指向多条记录。']
    ]},
    {title:'同一条查询第二次运行更快，能否直接证明索引有效？',options:[
      ['能，第二次更快只能由索引造成',false,'数据页可能已经进入缓冲区。'],
      ['不能，应考虑缓存，并结合执行计划与页读取量比较',true,'正确。冷热缓存会影响计时，单次时长证据不足。'],
      ['不能，因为索引永远不影响速度',false,'索引会影响访问路径，只是需要控制其他因素。'],
      ['能，只要两次SQL文本完全相同',false,'文本相同不代表缓存状态和系统负载相同。']
    ]},
    {title:'为什么选择性很低的条件即使有索引，优化器也可能选全表扫描？',options:[
      ['索引只能查询唯一值',false,'非唯一辅助索引也可使用。'],
      ['命中行太多，索引回表的随机访问总成本可能更高',true,'正确。连续读取全表有时更经济。'],
      ['WHERE中出现字符串就不能用索引',false,'字符串列也可以建立并使用索引。'],
      ['优化器会随机选择计划',false,'优化器依据统计信息和成本估计选择。']
    ]},
    {title:'索引让读取更快，为什么不为每个列组合都建索引？',options:[
      ['数据库限制每张表只能有一个索引',false,'通常可以有多个索引。'],
      ['索引占空间，写入还要同步维护，过多会增加更新成本',true,'正确。索引设计要结合真实查询与写入负载。'],
      ['索引建立后不能删除',false,'索引通常可以删除或重建。'],
      ['只有主键列允许建立索引',false,'普通列和组合列也可以建索引。']
    ]},
    {title:'EXPLAIN显示estimated rows=1，实际返回10000行。首先说明什么？',options:[
      ['SQL必然返回错误结果',false,'估计偏差影响计划选择，不等于查询语义错误。'],
      ['优化器对行数的估计明显偏差，应检查统计信息和数据分布',true,'正确。估计行数是理解计划风险的重要线索。'],
      ['索引中丢失了9999条记录',false,'实际结果已经返回10000行，不能据此断言索引丢数据。'],
      ['数据库把毫秒误写成行数',false,'rows字段描述估计或实际行数，具体看工具输出。']
    ]},
    {title:'查询只需要PID和Price，组合索引正好包含两列。可能避免什么？',options:[
      ['避免SQL解析',false,'SQL仍需解析与优化。'],
      ['避免访问基本表数据页，在索引中取得所需列',true,'正确。这是覆盖索引或index-only路径的核心可能性。'],
      ['避免WHERE条件判断',false,'仍需根据索引键范围判断匹配项。'],
      ['避免维护索引',false,'写入时仍需维护这个组合索引。']
    ]}
  ];
  Object.freeze(records);Object.freeze(pages);
  return {records,pages,denseIndex,sparseIndex,scan,indexLookup,categoryIndex,cost,lru,plans,questions};
});
