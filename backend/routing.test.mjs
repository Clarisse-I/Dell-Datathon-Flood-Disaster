import {test} from 'node:test';
import assert from 'node:assert/strict';
import {graphFrom,shortest,intersects} from './routing.mjs';
// Small test graph is a unit-test fixture, never a UI/demo route.
const nodes=[{type:'node',id:1,lat:29,lon:-98},{type:'node',id:2,lat:29,lon:-97.999},{type:'node',id:3,lat:29,lon:-97.998},{type:'node',id:4,lat:29.001,lon:-98},{type:'node',id:5,lat:29.001,lon:-97.998}];
const way=(id,ns,tags={})=>({type:'way',id,nodes:ns,tags:{highway:'residential',...tags}});
test('excludes crossing edges even with both endpoints outside circle; chooses alternate',()=>{const graph=graphFrom([...nodes,way(10,[1,2,3]),way(11,[1,4,5,3])]);const baseline=shortest(graph,1,3);const area={center:[29,-97.999],radius:30};const route=shortest(graph,1,3,area);assert(route.distance_m>baseline.distance_m);for(let i=1;i<route.coordinates.length;i++)assert(!intersects(route.coordinates[i-1],route.coordinates[i],area));assert(intersects([29,-98],[29,-97.998],area));});
test('no route through exclusion; respects one-way and private roads',()=>{const g=graphFrom([...nodes,way(10,[1,2,3],{oneway:'yes'}),way(11,[1,4,5,3],{access:'private'})]);assert.equal(shortest(g,1,3,{center:[29,-97.999],radius:30}),null);assert.equal(shortest(g,3,1),null);});
