export interface CepRotaParamItem {
  cep: string          // CEP de 8 dígitos ou prefixo de 5 dígitos
  descricaorota: string // Rota oficial correspondente (ex: '994-EC1 CE PACAJUS' ou '994-EC2 CE FORTALEZA A')
  destino?: string     // Destino opcional (ex: 'PACAJUS')
  regiao?: string      // Região opcional (ex: 'METROPOLITANA')
  cidade?: string      // Cidade/bairro ou observação
}

// Limpa e normaliza CEP para busca
export function cleanCep(c: any): string {
  if (!c && c !== 0) return ''
  let str = String(c).trim().replace(/\.0+$/, '').replace(/\D/g, '')
  if (!str) return ''
  if (str.length <= 5) return str
  return str.padStart(8, '0').slice(-8)
}

// Detecta se uma rota é genérica de trânsito/cross-docking
export function isGenericRoute(r: string | undefined | null): boolean {
  if (!r) return true
  const upper = r.trim().toUpperCase()
  if (upper.includes('CANDEIAS')) return true
  if (upper.includes('TR NE CEARA')) return true
  if (upper.includes('1500-RP1')) return true
  if (upper.includes('3NW 4SX 5XX-CE CAP')) return true
  if (upper.includes('5XX-CE CAP') && !upper.includes('FORTALEZA') && !upper.includes('CAUCAIA') && !upper.includes('MARACANAU')) return true
  if (upper.includes('5XX-CE INT') && !upper.includes('994') && !upper.includes('991')) return true
  if (upper.includes('1SX 2SX') && !upper.includes('994') && !upper.includes('991')) return true
  if (upper.includes('1NW 2NW') && !upper.includes('994') && !upper.includes('991')) return true
  return false
}

export const INITIAL_CEP_ROTA_PARAMS: CepRotaParamItem[] = [
  {
    "cep": "56230",
    "descricaorota": "994-TR1 PE CRATO SAT 3",
    "cidade": "Região Prefix 56230"
  },
  {
    "cep": "56230000",
    "descricaorota": "994-TR1 PE CRATO SAT 3"
  },
  {
    "cep": "60010",
    "descricaorota": "994-EC2 CE FORTALEZA A",
    "cidade": "Região Prefix 60010"
  },
  {
    "cep": "60010040",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60010220",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60010530",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60015",
    "descricaorota": "994-EC2 CE FORTALEZA H",
    "cidade": "Região Prefix 60015"
  },
  {
    "cep": "60015140",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60015180",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60015220",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60015290",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60020",
    "descricaorota": "994-EC2 CE FORTALEZA G",
    "cidade": "Região Prefix 60020"
  },
  {
    "cep": "60020030",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60020160",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60020181",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60020290",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA H 4SX 5XX-CE CAP"
  },
  {
    "cep": "60025",
    "descricaorota": "994-EC2 CE FORTALEZA G",
    "cidade": "Região Prefix 60025"
  },
  {
    "cep": "60025000",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60025061",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60025100",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60025131",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60025200",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "60030",
    "descricaorota": "994-EC2 CE FORTALEZA G",
    "cidade": "Região Prefix 60030"
  },
  {
    "cep": "60030140",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60035",
    "descricaorota": "994-EC2 CE FORTALEZA G",
    "cidade": "Região Prefix 60035"
  },
  {
    "cep": "60035111",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60035131",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60040",
    "descricaorota": "994-EC2 CE FORTALEZA G",
    "cidade": "Região Prefix 60040"
  },
  {
    "cep": "60040050",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60040350",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60050",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA G 4SX 5XX-CE CAP",
    "cidade": "Região Prefix 60050"
  },
  {
    "cep": "60050041",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60050080",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA G 4SX 5XX-CE CAP"
  },
  {
    "cep": "60050081",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60050101",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA G 4SX 5XX-CE CAP"
  },
  {
    "cep": "60055",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60055"
  },
  {
    "cep": "60055170",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60060",
    "descricaorota": "994-EC2 CE FORTALEZA J",
    "cidade": "Região Prefix 60060"
  },
  {
    "cep": "60060160",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60060325",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60060500",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60110",
    "descricaorota": "994-EC2 CE FORTALEZA G",
    "cidade": "Região Prefix 60110"
  },
  {
    "cep": "60110140",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60110300",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60115",
    "descricaorota": "994-EC2 CE FORTALEZA G",
    "cidade": "Região Prefix 60115"
  },
  {
    "cep": "60115046",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60115055",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA G 4SX 5XX-CE CAP"
  },
  {
    "cep": "60115080",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60115082",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60115280",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE"
  },
  {
    "cep": "60120",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA G 4SX 5XX-CE CAP",
    "cidade": "Região Prefix 60120"
  },
  {
    "cep": "60120020",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60120075",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA G 4SX 5XX-CE CAP"
  },
  {
    "cep": "60120270",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60125",
    "descricaorota": "994-EC2 CE FORTALEZA J",
    "cidade": "Região Prefix 60125"
  },
  {
    "cep": "60125001",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60125040",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA J 4SX 5XX-CE CAP"
  },
  {
    "cep": "60125058",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60125101",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60130",
    "descricaorota": "994-EC2 CE FORTALEZA G",
    "cidade": "Região Prefix 60130"
  },
  {
    "cep": "60130080",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60130100",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60130400",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60130550",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA G 4SX 5XX-CE CAP"
  },
  {
    "cep": "60135",
    "descricaorota": "994-EC2 CE FORTALEZA J",
    "cidade": "Região Prefix 60135"
  },
  {
    "cep": "60135000",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60135270",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60150",
    "descricaorota": "994-EC2 CE FORTALEZA J",
    "cidade": "Região Prefix 60150"
  },
  {
    "cep": "60150140",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60150161",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60160",
    "descricaorota": "994-EC2 CE FORTALEZA J",
    "cidade": "Região Prefix 60160"
  },
  {
    "cep": "60160060",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60160120",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60160250",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60160281",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60165",
    "descricaorota": "994-EC2 CE FORTALEZA J",
    "cidade": "Região Prefix 60165"
  },
  {
    "cep": "60165070",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60165081",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA J 4SX 5XX-CE CAP"
  },
  {
    "cep": "60165082",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60165170",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60165180",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60170",
    "descricaorota": "994-EC2 CE FORTALEZA J",
    "cidade": "Região Prefix 60170"
  },
  {
    "cep": "60170000",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA J 4SX 5XX-CE CAP"
  },
  {
    "cep": "60170151",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA J 4SX 5XX-CE CAP"
  },
  {
    "cep": "60170241",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60175",
    "descricaorota": "994-EC2 CE FORTALEZA K",
    "cidade": "Região Prefix 60175"
  },
  {
    "cep": "60175005",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60175040",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60175055",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60175090",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60175130",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60175175",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60175210",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60175222",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60175224",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60175230",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60175395",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60175440",
    "descricaorota": "994-EC2 CE FORTALEZA J"
  },
  {
    "cep": "60175742",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA K 4SX 5XX-CE CAP"
  },
  {
    "cep": "60180",
    "descricaorota": "994-EC2 CE FORTALEZA K",
    "cidade": "Região Prefix 60180"
  },
  {
    "cep": "60180635",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60180710",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60180750",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60181",
    "descricaorota": "994-EC2 CE FORTALEZA K",
    "cidade": "Região Prefix 60181"
  },
  {
    "cep": "60181200",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60181210",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60181240",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60181426",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60181445",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60181485",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60182",
    "descricaorota": "994-EC2 CE FORTALEZA K",
    "cidade": "Região Prefix 60182"
  },
  {
    "cep": "60182120",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60182335",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60182414",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA J 4SX 5XX-CE CAP"
  },
  {
    "cep": "60182453",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60184",
    "descricaorota": "994-EC2 CE FORTALEZA K",
    "cidade": "Região Prefix 60184"
  },
  {
    "cep": "60184200",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60184270",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60184300",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60190",
    "descricaorota": "994-EC2 CE FORTALEZA K",
    "cidade": "Região Prefix 60190"
  },
  {
    "cep": "60190140",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60190170",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60190240",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60190350",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60190620",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA K 4SX 5XX-CE CAP"
  },
  {
    "cep": "60191",
    "descricaorota": "994-EC2 CE FORTALEZA K",
    "cidade": "Região Prefix 60191"
  },
  {
    "cep": "60191335",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60191345",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60191670",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60192",
    "descricaorota": "994-EC2 CE FORTALEZA K",
    "cidade": "Região Prefix 60192"
  },
  {
    "cep": "60192022",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60192035",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60192085",
    "descricaorota": "994-EC2 CE FORTALEZA K"
  },
  {
    "cep": "60192105",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA K 4SX 5XX-CE CAP"
  },
  {
    "cep": "60310",
    "descricaorota": "994-EC2 CE FORTALEZA A",
    "cidade": "Região Prefix 60310"
  },
  {
    "cep": "60310001",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60310030",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60310042",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60310043",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60310430",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60311",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60311"
  },
  {
    "cep": "60311230",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60311310",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60311630",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60311750",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60320",
    "descricaorota": "994-EC2 CE FORTALEZA A",
    "cidade": "Região Prefix 60320"
  },
  {
    "cep": "60320040",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60320104",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60320270",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60320275",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60320350",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60325",
    "descricaorota": "994-EC2 CE FORTALEZA A",
    "cidade": "Região Prefix 60325"
  },
  {
    "cep": "60325001",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60325002",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60325450",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60325647",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60326",
    "descricaorota": "994-EC2 CE FORTALEZA A",
    "cidade": "Região Prefix 60326"
  },
  {
    "cep": "60326305",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60330",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60330"
  },
  {
    "cep": "60330142",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60330330",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60330490",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA B 4SX 5XX-CE CAP"
  },
  {
    "cep": "60330792",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60331",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60331"
  },
  {
    "cep": "60331290",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60331560",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60331790",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60332",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60332"
  },
  {
    "cep": "60332030",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60332420",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60332530",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60332680",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60334",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60334"
  },
  {
    "cep": "60334150",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60334172",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60335",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60335"
  },
  {
    "cep": "60335000",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA B 4SX 5XX-CE CAP"
  },
  {
    "cep": "60335020",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60335580",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60335640",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60335700",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60336",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60336"
  },
  {
    "cep": "60336190",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60336230",
    "descricaorota": "PRAÇA 0"
  },
  {
    "cep": "60336295",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60337",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60337"
  },
  {
    "cep": "60337390",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60337420",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60340",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60340"
  },
  {
    "cep": "60340085",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60340110",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60340505",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60340605",
    "descricaorota": "PRAÇA 0"
  },
  {
    "cep": "60341",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60341"
  },
  {
    "cep": "60341020",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60341140",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60341820",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60345",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60345"
  },
  {
    "cep": "60345151",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60345632",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60345820",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60345848",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60346",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60346"
  },
  {
    "cep": "60346163",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60346165",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60346195",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60346251",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60346285",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA B 4SX 5XX-CE CAP"
  },
  {
    "cep": "60346352",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60346672",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60347",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60347"
  },
  {
    "cep": "60347025",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60347032",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60347110",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60347112",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60347255",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60347325",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60347700",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60347810",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60348",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60348"
  },
  {
    "cep": "60348070",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60349",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60349"
  },
  {
    "cep": "60349030",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60349130",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60349370",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60350",
    "descricaorota": "994-EC2 CE FORTALEZA A",
    "cidade": "Região Prefix 60350"
  },
  {
    "cep": "60350550",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60351",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60351"
  },
  {
    "cep": "60351000",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60351120",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60351230",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60351364",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60351558",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60351610",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60351780",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60351810",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60352",
    "descricaorota": "994-EC2 CE FORTALEZA B",
    "cidade": "Região Prefix 60352"
  },
  {
    "cep": "60352500",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60352710",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60352840",
    "descricaorota": "994-EC2 CE FORTALEZA B"
  },
  {
    "cep": "60355",
    "descricaorota": "994-EC2 CE FORTALEZA A",
    "cidade": "Região Prefix 60355"
  },
  {
    "cep": "60355265",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60355302",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60355305",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60355420",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60355487",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60356",
    "descricaorota": "994-EC2 CE FORTALEZA A",
    "cidade": "Região Prefix 60356"
  },
  {
    "cep": "60356150",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60356315",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60360",
    "descricaorota": "994-EC2 CE FORTALEZA A",
    "cidade": "Região Prefix 60360"
  },
  {
    "cep": "60360052",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60360120",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60360720",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60360721",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA A 4SX 5XX-CE CAP"
  },
  {
    "cep": "60361",
    "descricaorota": "994-EC2 CE FORTALEZA A",
    "cidade": "Região Prefix 60361"
  },
  {
    "cep": "60361030",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60361130",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60361240",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60410",
    "descricaorota": "994-EC2 CE FORTALEZA H",
    "cidade": "Região Prefix 60410"
  },
  {
    "cep": "60410220",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60410222",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60410329",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60410369",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60410426",
    "descricaorota": "994-EC1 CE CANINDE"
  },
  {
    "cep": "60410622",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60410642",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60411",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60411"
  },
  {
    "cep": "60411055",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60411280",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60415",
    "descricaorota": "994-EC2 CE FORTALEZA G",
    "cidade": "Região Prefix 60415"
  },
  {
    "cep": "60415285",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60415560",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60416",
    "descricaorota": "994-EC2 CE FORTALEZA H",
    "cidade": "Região Prefix 60416"
  },
  {
    "cep": "60416172",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60420",
    "descricaorota": "994-EC2 CE FORTALEZA H",
    "cidade": "Região Prefix 60420"
  },
  {
    "cep": "60420310",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA H 4SX 5XX-CE CAP"
  },
  {
    "cep": "60420431",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60420432",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60421",
    "descricaorota": "994-EC2 CE FORTALEZA H",
    "cidade": "Região Prefix 60421"
  },
  {
    "cep": "60421000",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60421105",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60422",
    "descricaorota": "994-EC2 CE FORTALEZA H",
    "cidade": "Região Prefix 60422"
  },
  {
    "cep": "60422700",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60426",
    "descricaorota": "994-EC2 CE FORTALEZA H",
    "cidade": "Região Prefix 60426"
  },
  {
    "cep": "60426000",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60430",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60430"
  },
  {
    "cep": "60430025",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60430180",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60430760",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60440",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60440"
  },
  {
    "cep": "60440092",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60440110",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60440380",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60440612",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60440782",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60441",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60441"
  },
  {
    "cep": "60441005",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60442",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60442"
  },
  {
    "cep": "60442021",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60442056",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60442740",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60442775",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60450",
    "descricaorota": "994-EC2 CE FORTALEZA A",
    "cidade": "Região Prefix 60450"
  },
  {
    "cep": "60450175",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60450245",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60450255",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60450305",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60450610",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60455",
    "descricaorota": "994-EC2 CE FORTALEZA A",
    "cidade": "Região Prefix 60455"
  },
  {
    "cep": "60455001",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60455165",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA A 4SX 5XX-CE CAP"
  },
  {
    "cep": "60455305",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA A 4SX 5XX-CE CAP"
  },
  {
    "cep": "60455340",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60455472",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA A 4SX 5XX-CE CAP"
  },
  {
    "cep": "60455505",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60510",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60510"
  },
  {
    "cep": "60510118",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60510138",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60510190",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60510550",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60510650",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60511",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA E 4SX 5XX-CE CAP",
    "cidade": "Região Prefix 60511"
  },
  {
    "cep": "60511640",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60511735",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA E 4SX 5XX-CE CAP"
  },
  {
    "cep": "60520",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60520"
  },
  {
    "cep": "60520101",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60520265",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60520790",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60521",
    "descricaorota": "994-EC2 CE FORTALEZA F",
    "cidade": "Região Prefix 60521"
  },
  {
    "cep": "60521025",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60521045",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60521065",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60521075",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60525",
    "descricaorota": "994-EC2 CE FORTALEZA F",
    "cidade": "Região Prefix 60525"
  },
  {
    "cep": "60525233",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60525625",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60525680",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60526",
    "descricaorota": "994-EC2 CE FORTALEZA F",
    "cidade": "Região Prefix 60526"
  },
  {
    "cep": "60526045",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60526065",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA F 4SX 5XX-CE CAP"
  },
  {
    "cep": "60526640",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60526647",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60530",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60530"
  },
  {
    "cep": "60530390",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60531",
    "descricaorota": "994-EC2 CE FORTALEZA F",
    "cidade": "Região Prefix 60531"
  },
  {
    "cep": "60531630",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60531660",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60531750",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60531810",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60532",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60532"
  },
  {
    "cep": "60532120",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA F 4SX 5XX-CE CAP"
  },
  {
    "cep": "60532180",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60532320",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60533",
    "descricaorota": "994-EC2 CE FORTALEZA F",
    "cidade": "Região Prefix 60533"
  },
  {
    "cep": "60533520",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60533614",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60534",
    "descricaorota": "994-EC2 CE FORTALEZA F",
    "cidade": "Região Prefix 60534"
  },
  {
    "cep": "60534090",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60534150",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60534240",
    "descricaorota": "994-EC1 CE PACAJUS"
  },
  {
    "cep": "60534260",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60534440",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60534640",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60540",
    "descricaorota": "994-EC2 CE FORTALEZA D",
    "cidade": "Região Prefix 60540"
  },
  {
    "cep": "60540060",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60540121",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60540235",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60540255",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA D 4SX 5XX-CE CAP"
  },
  {
    "cep": "60540262",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60540456",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60540468",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60540485",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60540492",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60540496",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60540509",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60540522",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60540542",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60540755",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60540805",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60540834",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60540835",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60541",
    "descricaorota": "994-EC2 CE FORTALEZA F",
    "cidade": "Região Prefix 60541"
  },
  {
    "cep": "60541100",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60541115",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60541242",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "60541245",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60541646",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60542",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60542"
  },
  {
    "cep": "60542395",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60542400",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60542660",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60543",
    "descricaorota": "994-EC2 CE FORTALEZA D",
    "cidade": "Região Prefix 60543"
  },
  {
    "cep": "60543305",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60543345",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60543352",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60543355",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60543362",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60543368",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60543462",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60543466",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60543630",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60544",
    "descricaorota": "994-EC2 CE FORTALEZA D",
    "cidade": "Região Prefix 60544"
  },
  {
    "cep": "60544325",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60544793",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60545",
    "descricaorota": "994-EC2 CE FORTALEZA F",
    "cidade": "Região Prefix 60545"
  },
  {
    "cep": "60545266",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60545350",
    "descricaorota": "994-EC2 CE FORTALEZA F"
  },
  {
    "cep": "60710",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60710"
  },
  {
    "cep": "60710000",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60710095",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60710580",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60710610",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60710680",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60711",
    "descricaorota": "994-EC2 CE FORTALEZA C",
    "cidade": "Região Prefix 60711"
  },
  {
    "cep": "60711035",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60711520",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60712",
    "descricaorota": "994-EC2 CE FORTALEZA C",
    "cidade": "Região Prefix 60712"
  },
  {
    "cep": "60712108",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60713",
    "descricaorota": "994-EC2 CE FORTALEZA C",
    "cidade": "Região Prefix 60713"
  },
  {
    "cep": "60713070",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60713180",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60713300",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60713330",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA C 4SX 5XX-CE CAP"
  },
  {
    "cep": "60713410",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60713500",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60713750",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA C 4SX 5XX-CE CAP"
  },
  {
    "cep": "60714",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60714"
  },
  {
    "cep": "60714210",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60714240",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60714350",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60714712",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60720",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60720"
  },
  {
    "cep": "60720096",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60720580",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60720620",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60720720",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60730",
    "descricaorota": "994-EC2 CE FORTALEZA C",
    "cidade": "Região Prefix 60730"
  },
  {
    "cep": "60730068",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60730155",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60730175",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60730225",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60730245",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60731",
    "descricaorota": "994-EC2 CE FORTALEZA D",
    "cidade": "Região Prefix 60731"
  },
  {
    "cep": "60731005",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60731555",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60731722",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA D 4SX 5XX-CE CAP"
  },
  {
    "cep": "60732",
    "descricaorota": "994-EC2 CE FORTALEZA D",
    "cidade": "Região Prefix 60732"
  },
  {
    "cep": "60732140",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA D 4SX 5XX-CE CAP"
  },
  {
    "cep": "60732270",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA D 4SX 5XX-CE CAP"
  },
  {
    "cep": "60732290",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60732392",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60732444",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60732455",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60732558",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60734",
    "descricaorota": "994-EC2 CE FORTALEZA D",
    "cidade": "Região Prefix 60734"
  },
  {
    "cep": "60734090",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60734290",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60734520",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60740",
    "descricaorota": "994-EC2 CE FORTALEZA E",
    "cidade": "Região Prefix 60740"
  },
  {
    "cep": "60740020",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60740190",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60740325",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60740420",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60740470",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60741",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60741"
  },
  {
    "cep": "60741200",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60741225",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA I 4SX 5XX-CE CAP"
  },
  {
    "cep": "60741525",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60742",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60742"
  },
  {
    "cep": "60742165",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60742766",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60743",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60743"
  },
  {
    "cep": "60743010",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "60743245",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60743262",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60743340",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60743670",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60744",
    "descricaorota": "994-EC2 CE FORTALEZA H",
    "cidade": "Região Prefix 60744"
  },
  {
    "cep": "60744012",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60744315",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60745",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60745"
  },
  {
    "cep": "60745700",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60745744",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60748",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60748"
  },
  {
    "cep": "60748357",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60748445",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60749",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA I 4SX 5XX-CE CAP",
    "cidade": "Região Prefix 60749"
  },
  {
    "cep": "60749050",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA I 4SX 5XX-CE CAP"
  },
  {
    "cep": "60750",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60750"
  },
  {
    "cep": "60750060",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60750650",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60750740",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60751",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60751"
  },
  {
    "cep": "60751070",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60751100",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60751260",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60751565",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60752",
    "descricaorota": "994-EC2 CE FORTALEZA C",
    "cidade": "Região Prefix 60752"
  },
  {
    "cep": "60752310",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60752330",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA C 4SX 5XX-CE CAP"
  },
  {
    "cep": "60752694",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60760",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA I 4SX 5XX-CE CAP",
    "cidade": "Região Prefix 60760"
  },
  {
    "cep": "60760530",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA I 4SX 5XX-CE CAP"
  },
  {
    "cep": "60761",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60761"
  },
  {
    "cep": "60761281",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60761282",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60761445",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA C 4SX 5XX-CE CAP"
  },
  {
    "cep": "60761455",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60761470",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "60761520",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60762",
    "descricaorota": "994-EC2 CE FORTALEZA C",
    "cidade": "Região Prefix 60762"
  },
  {
    "cep": "60762376",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60762591",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60762593",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60763",
    "descricaorota": "994-EC2 CE FORTALEZA D",
    "cidade": "Região Prefix 60763"
  },
  {
    "cep": "60763012",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60763035",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA D 4SX 5XX-CE CAP"
  },
  {
    "cep": "60763450",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60763580",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60764",
    "descricaorota": "994-EC2 CE FORTALEZA C",
    "cidade": "Região Prefix 60764"
  },
  {
    "cep": "60764020",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60764145",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60764330",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60764425",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60764645",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60765",
    "descricaorota": "994-EC2 CE FORTALEZA C",
    "cidade": "Região Prefix 60765"
  },
  {
    "cep": "60765054",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60765370",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60765372",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60765374",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60765612",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60765614",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60765640",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "60766",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60766"
  },
  {
    "cep": "60766120",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60766185",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60766730",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60766775",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60767",
    "descricaorota": "994-EC2 CE FORTALEZA C",
    "cidade": "Região Prefix 60767"
  },
  {
    "cep": "60767340",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60767623",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60767650",
    "descricaorota": "994-EC2 CE FORTALEZA C"
  },
  {
    "cep": "60767700",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA C 4SX 5XX-CE CAP"
  },
  {
    "cep": "60810",
    "descricaorota": "994-EC2 CE FORTALEZA L",
    "cidade": "Região Prefix 60810"
  },
  {
    "cep": "60810050",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60810310",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60810520",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60810670",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60810770",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60810786",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60811",
    "descricaorota": "994-EC2 CE FORTALEZA L",
    "cidade": "Região Prefix 60811"
  },
  {
    "cep": "60811110",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60811120",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60811160",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60811170",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA L 4SX 5XX-CE CAP"
  },
  {
    "cep": "60811190",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA L 4SX 5XX-CE CAP"
  },
  {
    "cep": "60811275",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60811341",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60812",
    "descricaorota": "994-EC2 CE FORTALEZA L",
    "cidade": "Região Prefix 60812"
  },
  {
    "cep": "60812100",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60812110",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60812450",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60812555",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60813",
    "descricaorota": "994-EC2 CE FORTALEZA L",
    "cidade": "Região Prefix 60813"
  },
  {
    "cep": "60813809",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60821",
    "descricaorota": "994-EC2 CE FORTALEZA L",
    "cidade": "Região Prefix 60821"
  },
  {
    "cep": "60821470",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60821655",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60821750",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60822",
    "descricaorota": "994-EC2 CE FORTALEZA N",
    "cidade": "Região Prefix 60822"
  },
  {
    "cep": "60822130",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60822142",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60822348",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60822585",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60824",
    "descricaorota": "994-EC2 CE FORTALEZA N",
    "cidade": "Região Prefix 60824"
  },
  {
    "cep": "60824000",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60824245",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60830",
    "descricaorota": "994-EC2 CE FORTALEZA N",
    "cidade": "Região Prefix 60830"
  },
  {
    "cep": "60830435",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60830635",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60831",
    "descricaorota": "994-EC2 CE FORTALEZA L",
    "cidade": "Região Prefix 60831"
  },
  {
    "cep": "60831240",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60831370",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60831403",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60831413",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60831417",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60831545",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60831663",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60831811",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60833",
    "descricaorota": "994-EC2 CE FORTALEZA L",
    "cidade": "Região Prefix 60833"
  },
  {
    "cep": "60833075",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60833175",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60833183",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60834",
    "descricaorota": "994-EC2 CE FORTALEZA L",
    "cidade": "Região Prefix 60834"
  },
  {
    "cep": "60834366",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60834375",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60834522",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60835",
    "descricaorota": "994-EC2 CE FORTALEZA L",
    "cidade": "Região Prefix 60835"
  },
  {
    "cep": "60835025",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60840",
    "descricaorota": "994-EC2 CE FORTALEZA N",
    "cidade": "Região Prefix 60840"
  },
  {
    "cep": "60840400",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60841",
    "descricaorota": "994-EC2 CE FORTALEZA N",
    "cidade": "Região Prefix 60841"
  },
  {
    "cep": "60841080",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60841645",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60841710",
    "descricaorota": "994-EC1 CE ICO"
  },
  {
    "cep": "60842",
    "descricaorota": "994-EC2 CE FORTALEZA N",
    "cidade": "Região Prefix 60842"
  },
  {
    "cep": "60842010",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60842120",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60843",
    "descricaorota": "994-EC2 CE FORTALEZA L",
    "cidade": "Região Prefix 60843"
  },
  {
    "cep": "60843190",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60850",
    "descricaorota": "994-EC2 CE FORTALEZA G",
    "cidade": "Região Prefix 60850"
  },
  {
    "cep": "60850530",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60850665",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60851",
    "descricaorota": "994-EC2 CE FORTALEZA G",
    "cidade": "Região Prefix 60851"
  },
  {
    "cep": "60851170",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60851290",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "60860",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60860"
  },
  {
    "cep": "60860522",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60861",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60861"
  },
  {
    "cep": "60861330",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60861380",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60861395",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60861634",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60861820",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60862",
    "descricaorota": "994-EC2 CE FORTALEZA M",
    "cidade": "Região Prefix 60862"
  },
  {
    "cep": "60862224",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60862450",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "60862750",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60862800",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60863",
    "descricaorota": "994-EC2 CE FORTALEZA M",
    "cidade": "Região Prefix 60863"
  },
  {
    "cep": "60863010",
    "descricaorota": "994-EC1 CE CASCAVEL"
  },
  {
    "cep": "60863357",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60863364",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60864",
    "descricaorota": "994-EC2 CE FORTALEZA L",
    "cidade": "Região Prefix 60864"
  },
  {
    "cep": "60864240",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60864310",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60864311",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60864330",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60864655",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60865",
    "descricaorota": "994-EC2 CE FORTALEZA M",
    "cidade": "Região Prefix 60865"
  },
  {
    "cep": "60865020",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60865095",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60865210",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60865310",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60866",
    "descricaorota": "994-EC2 CE FORTALEZA M",
    "cidade": "Região Prefix 60866"
  },
  {
    "cep": "60866160",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60866190",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60866210",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60866216",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60866230",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60866475",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60866664",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA M 4SX 5XX-CE CAP"
  },
  {
    "cep": "60867",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60867"
  },
  {
    "cep": "60867010",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60867300",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60867695",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60868",
    "descricaorota": "994-EC2 CE FORTALEZA I",
    "cidade": "Região Prefix 60868"
  },
  {
    "cep": "60868672",
    "descricaorota": "994-EC2 CE FORTALEZA I"
  },
  {
    "cep": "60870",
    "descricaorota": "994-EC2 CE FORTALEZA M",
    "cidade": "Região Prefix 60870"
  },
  {
    "cep": "60870080",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60870340",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "60870420",
    "descricaorota": "994-EC2 CE FORTALEZA E"
  },
  {
    "cep": "60870440",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60870582",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60870640",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60870740",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60870844",
    "descricaorota": "994-EC2 CE FORTALEZA H"
  },
  {
    "cep": "60871",
    "descricaorota": "994-EC2 CE FORTALEZA N",
    "cidade": "Região Prefix 60871"
  },
  {
    "cep": "60871580",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60871586",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60871742",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60871760",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60871790",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60872",
    "descricaorota": "994-EC2 CE FORTALEZA N",
    "cidade": "Região Prefix 60872"
  },
  {
    "cep": "60872310",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60872330",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60872411",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60873",
    "descricaorota": "994-EC2 CE FORTALEZA M",
    "cidade": "Região Prefix 60873"
  },
  {
    "cep": "60873010",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60873068",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60873575",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60873740",
    "descricaorota": "1NW 2NW 994-RP1 FORTALEZA M 4SX 5XX-CE CAP"
  },
  {
    "cep": "60873810",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60874",
    "descricaorota": "994-EC2 CE FORTALEZA M",
    "cidade": "Região Prefix 60874"
  },
  {
    "cep": "60874050",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60874218",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60874224",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60874240",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60874770",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60875",
    "descricaorota": "994-EC2 CE FORTALEZA N",
    "cidade": "Região Prefix 60875"
  },
  {
    "cep": "60875622",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60875728",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60876",
    "descricaorota": "994-EC2 CE FORTALEZA N",
    "cidade": "Região Prefix 60876"
  },
  {
    "cep": "60876320",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60876400",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60876670",
    "descricaorota": "994-EC2 CE FORTALEZA N"
  },
  {
    "cep": "60877",
    "descricaorota": "994-EC2 CE FORTALEZA M",
    "cidade": "Região Prefix 60877"
  },
  {
    "cep": "60877238",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60877244",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60877275",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60877410",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60877520",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "60877523",
    "descricaorota": "994-EC2 CE FORTALEZA M"
  },
  {
    "cep": "61600",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61600"
  },
  {
    "cep": "61600004",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61600060",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61600310",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61600360",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61600370",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61602",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61602"
  },
  {
    "cep": "61602315",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61602330",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61603",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61603"
  },
  {
    "cep": "61603150",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61604",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61604"
  },
  {
    "cep": "61604260",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61605",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61605"
  },
  {
    "cep": "61605180",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61605725",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61606",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Caucaia Centro"
  },
  {
    "cep": "61608",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61608"
  },
  {
    "cep": "61608200",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61610",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61610"
  },
  {
    "cep": "61610405",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61616",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61616"
  },
  {
    "cep": "61616992",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61618",
    "descricaorota": "994-EC1 CE CAUCAIA B",
    "cidade": "Região Prefix 61618"
  },
  {
    "cep": "61618770",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61619",
    "descricaorota": "994-EC1 CE CAUCAIA B",
    "cidade": "Região Prefix 61619"
  },
  {
    "cep": "61619007",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61619135",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61619400",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61620",
    "descricaorota": "994-EC1 CE CAUCAIA B",
    "cidade": "Região Prefix 61620"
  },
  {
    "cep": "61620090",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61620300",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61621",
    "descricaorota": "994-EC1 CE CAUCAIA B",
    "cidade": "Região Prefix 61621"
  },
  {
    "cep": "61621025",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61621125",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61622",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61622"
  },
  {
    "cep": "61622010",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61623",
    "descricaorota": "994-EC1 CE CAUCAIA B",
    "cidade": "Região Prefix 61623"
  },
  {
    "cep": "61623375",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61625",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61625"
  },
  {
    "cep": "61625020",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61626",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61626"
  },
  {
    "cep": "61626240",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61627",
    "descricaorota": "994-EC1 CE CAUCAIA B",
    "cidade": "Região Prefix 61627"
  },
  {
    "cep": "61627430",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61628",
    "descricaorota": "994-EC1 CE CAUCAIA B",
    "cidade": "Região Prefix 61628"
  },
  {
    "cep": "61628190",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61629",
    "descricaorota": "994-EC1 CE CAUCAIA B",
    "cidade": "Caucaia Litoral"
  },
  {
    "cep": "61631",
    "descricaorota": "994-EC1 CE CAUCAIA B",
    "cidade": "Região Prefix 61631"
  },
  {
    "cep": "61631020",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61631025",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61634",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61634"
  },
  {
    "cep": "61634010",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61635",
    "descricaorota": "994-EC2 CE FORTALEZA G",
    "cidade": "Região Prefix 61635"
  },
  {
    "cep": "61635020",
    "descricaorota": "994-EC2 CE FORTALEZA G"
  },
  {
    "cep": "61635035",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61636",
    "descricaorota": "994-EC1 CE CAUCAIA B",
    "cidade": "Região Prefix 61636"
  },
  {
    "cep": "61636465",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61640",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61640"
  },
  {
    "cep": "61640170",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61640300",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61645",
    "descricaorota": "994-EC1 CE CAUCAIA B",
    "cidade": "Região Prefix 61645"
  },
  {
    "cep": "61645340",
    "descricaorota": "994-EC1 CE CAUCAIA B"
  },
  {
    "cep": "61645450",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61648",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61648"
  },
  {
    "cep": "61648190",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61648280",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61650",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61650"
  },
  {
    "cep": "61650000",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61650050",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61650160",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61650190",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61650210",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61650280",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61650410",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61650520",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61650530",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61652",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61652"
  },
  {
    "cep": "61652030",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61652180",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61652640",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61652660",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61652680",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61654",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61654"
  },
  {
    "cep": "61654125",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61655",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61655"
  },
  {
    "cep": "61655560",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61656",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61656"
  },
  {
    "cep": "61656145",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "61656230",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61658",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61658"
  },
  {
    "cep": "61658032",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61658470",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61658630",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61658730",
    "descricaorota": "994-EC2 CE FORTALEZA A"
  },
  {
    "cep": "61660",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61660"
  },
  {
    "cep": "61660010",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61669",
    "descricaorota": "994-EC1 CE CAUCAIA SAT 1",
    "cidade": "Região Prefix 61669"
  },
  {
    "cep": "61669650",
    "descricaorota": "994-EC1 CE CAUCAIA SAT 1"
  },
  {
    "cep": "61680",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61680"
  },
  {
    "cep": "61680000",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61685",
    "descricaorota": "994-EC1 CE CAUCAIA A",
    "cidade": "Região Prefix 61685"
  },
  {
    "cep": "61685000",
    "descricaorota": "994-EC1 CE CAUCAIA A"
  },
  {
    "cep": "61695",
    "descricaorota": "994-EC1 CE CAUCAIA SAT 1",
    "cidade": "Região Prefix 61695"
  },
  {
    "cep": "61695000",
    "descricaorota": "994-EC1 CE CAUCAIA SAT 1"
  },
  {
    "cep": "61700",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 1",
    "cidade": "Região Prefix 61700"
  },
  {
    "cep": "61700000",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 1"
  },
  {
    "cep": "61760",
    "descricaorota": "994-EC1 CE EUSEBIO",
    "cidade": "Região Prefix 61760"
  },
  {
    "cep": "61760046",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61760320",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61760420",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61760430",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61761",
    "descricaorota": "994-EC1 CE EUSEBIO",
    "cidade": "Região Prefix 61761"
  },
  {
    "cep": "61761210",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61762",
    "descricaorota": "994-EC1 CE EUSEBIO",
    "cidade": "Região Prefix 61762"
  },
  {
    "cep": "61762360",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61762780",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61763",
    "descricaorota": "994-EC1 CE EUSEBIO",
    "cidade": "Região Prefix 61763"
  },
  {
    "cep": "61763330",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61765",
    "descricaorota": "994-EC1 CE EUSEBIO",
    "cidade": "Região Prefix 61765"
  },
  {
    "cep": "61765140",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61767",
    "descricaorota": "994-EC1 CE EUSEBIO",
    "cidade": "Região Prefix 61767"
  },
  {
    "cep": "61767210",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61768",
    "descricaorota": "994-EC1 CE EUSEBIO",
    "cidade": "Região Prefix 61768"
  },
  {
    "cep": "61768680",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61770",
    "descricaorota": "994-EC1 CE EUSEBIO",
    "cidade": "Região Prefix 61770"
  },
  {
    "cep": "61770030",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61770040",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61771",
    "descricaorota": "994-EC1 CE EUSEBIO",
    "cidade": "Região Prefix 61771"
  },
  {
    "cep": "61771800",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61772",
    "descricaorota": "994-EC1 CE EUSEBIO",
    "cidade": "Região Prefix 61772"
  },
  {
    "cep": "61772890",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61775",
    "descricaorota": "994-EC1 CE EUSEBIO",
    "cidade": "Região Prefix 61775"
  },
  {
    "cep": "61775550",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61776",
    "descricaorota": "994-EC2 CE FORTALEZA L",
    "cidade": "Região Prefix 61776"
  },
  {
    "cep": "61776820",
    "descricaorota": "994-EC2 CE FORTALEZA L"
  },
  {
    "cep": "61777",
    "descricaorota": "994-EC1 CE EUSEBIO",
    "cidade": "Região Prefix 61777"
  },
  {
    "cep": "61777290",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61777460",
    "descricaorota": "994-EC1 CE EUSEBIO"
  },
  {
    "cep": "61800",
    "descricaorota": "994-EC1 CE MARANGUAPE",
    "cidade": "Maranguape"
  },
  {
    "cep": "61801",
    "descricaorota": "994-EC1 CE MARANGUAPE",
    "cidade": "Maranguape"
  },
  {
    "cep": "61802",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2",
    "cidade": "Região Prefix 61802"
  },
  {
    "cep": "61802210",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61803",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2",
    "cidade": "Região Prefix 61803"
  },
  {
    "cep": "61803160",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61805",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2",
    "cidade": "Região Prefix 61805"
  },
  {
    "cep": "61805770",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61809",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2",
    "cidade": "Região Prefix 61809"
  },
  {
    "cep": "61809100",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61809125",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61809180",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61810",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2",
    "cidade": "Região Prefix 61810"
  },
  {
    "cep": "61810360",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61814",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2",
    "cidade": "Região Prefix 61814"
  },
  {
    "cep": "61814084",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61814108",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61814112",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61814164",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61814172",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61814300",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61814304",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61814328",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61814560",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61814592",
    "descricaorota": "994-EC1 CE MARACANAU SAT 2"
  },
  {
    "cep": "61880",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2",
    "cidade": "Região Prefix 61880"
  },
  {
    "cep": "61880043",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61880565",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61881",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2",
    "cidade": "Região Prefix 61881"
  },
  {
    "cep": "61881128",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61883",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2",
    "cidade": "Região Prefix 61883"
  },
  {
    "cep": "61883350",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61884",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2",
    "cidade": "Região Prefix 61884"
  },
  {
    "cep": "61884606",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61884876",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61885",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2",
    "cidade": "Região Prefix 61885"
  },
  {
    "cep": "61885660",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61885750",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61887",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2",
    "cidade": "Região Prefix 61887"
  },
  {
    "cep": "61887152",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61887279",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61887480",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61887521",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61887665",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61887677",
    "descricaorota": "994-EC1 CE EUSEBIO SAT 2"
  },
  {
    "cep": "61890",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61890"
  },
  {
    "cep": "61890000",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61900",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61900"
  },
  {
    "cep": "61900005",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61900022",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61900025",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61900080",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61900225",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61900430",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61900590",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61900620",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61900660",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61901",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61901"
  },
  {
    "cep": "61901060",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61901080",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61901120",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61901160",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61901170",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61901180",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61901280",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61905",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61905"
  },
  {
    "cep": "61905040",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61905050",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61905312",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61905342",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61905570",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61905610",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61905620",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61907",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61907"
  },
  {
    "cep": "61907260",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61910",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61910"
  },
  {
    "cep": "61910075",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61913",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61913"
  },
  {
    "cep": "61913360",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61914",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61914"
  },
  {
    "cep": "61914080",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61915",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61915"
  },
  {
    "cep": "61915507",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61917",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61917"
  },
  {
    "cep": "61917040",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61919",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61919"
  },
  {
    "cep": "61919000",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61919430",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61920",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61920"
  },
  {
    "cep": "61920220",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61920240",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61920300",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61920570",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61920680",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61922",
    "descricaorota": "994-EC2 CE FORTALEZA D",
    "cidade": "Região Prefix 61922"
  },
  {
    "cep": "61922180",
    "descricaorota": "994-EC2 CE FORTALEZA D"
  },
  {
    "cep": "61925",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61925"
  },
  {
    "cep": "61925470",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61932",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61932"
  },
  {
    "cep": "61932450",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61932502",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61932505",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61932540",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61932600",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61933",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61933"
  },
  {
    "cep": "61933160",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61933310",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61934",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61934"
  },
  {
    "cep": "61934030",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61934090",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61934210",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61935",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61935"
  },
  {
    "cep": "61935240",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61935270",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61936",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61936"
  },
  {
    "cep": "61936235",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61936320",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61936330",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61936360",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61936440",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61939",
    "descricaorota": "994-EC1 CE MARACANAU",
    "cidade": "Região Prefix 61939"
  },
  {
    "cep": "61939000",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61940",
    "descricaorota": "994-EC1 CE MARANGUAPE",
    "cidade": "Região Prefix 61940"
  },
  {
    "cep": "61940005",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61940025",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61940035",
    "descricaorota": "994-EC1 CE MARACANAU"
  },
  {
    "cep": "61940105",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61940370",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61941",
    "descricaorota": "994-EC1 CE MARANGUAPE",
    "cidade": "Região Prefix 61941"
  },
  {
    "cep": "61941002",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61942",
    "descricaorota": "994-EC1 CE MARANGUAPE",
    "cidade": "Região Prefix 61942"
  },
  {
    "cep": "61942552",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61942562",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61943",
    "descricaorota": "994-EC1 CE MARANGUAPE",
    "cidade": "Região Prefix 61943"
  },
  {
    "cep": "61943115",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61943240",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61943480",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61944",
    "descricaorota": "994-EC1 CE MARANGUAPE",
    "cidade": "Região Prefix 61944"
  },
  {
    "cep": "61944130",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61944470",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61944735",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61946",
    "descricaorota": "994-EC1 CE MARANGUAPE",
    "cidade": "Região Prefix 61946"
  },
  {
    "cep": "61946190",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61946400",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61946430",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61948",
    "descricaorota": "994-EC1 CE MARANGUAPE",
    "cidade": "Região Prefix 61948"
  },
  {
    "cep": "61948260",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61948330",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61949",
    "descricaorota": "994-EC1 CE MARANGUAPE",
    "cidade": "Região Prefix 61949"
  },
  {
    "cep": "61949150",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61949230",
    "descricaorota": "994-EC1 CE MARANGUAPE"
  },
  {
    "cep": "61950",
    "descricaorota": "994-EC1 CE MARANGUAPE SAT 1",
    "cidade": "Região Prefix 61950"
  },
  {
    "cep": "61950000",
    "descricaorota": "994-EC1 CE MARANGUAPE SAT 1"
  },
  {
    "cep": "61976",
    "descricaorota": "994-EC1 CE MARANGUAPE SAT 1",
    "cidade": "Maranguape Interior"
  },
  {
    "cep": "61979",
    "descricaorota": "994-EC1 CE MARANGUAPE SAT 2",
    "cidade": "Região Prefix 61979"
  },
  {
    "cep": "61979000",
    "descricaorota": "994-EC1 CE MARANGUAPE SAT 2"
  },
  {
    "cep": "61982",
    "descricaorota": "994-EC1 CE MARANGUAPE SAT 2",
    "cidade": "Região Prefix 61982"
  },
  {
    "cep": "61982000",
    "descricaorota": "994-EC1 CE MARANGUAPE SAT 2"
  },
  {
    "cep": "61991",
    "descricaorota": "994-EC1 CE MARANGUAPE SAT 2",
    "cidade": "Região Prefix 61991"
  },
  {
    "cep": "61991000",
    "descricaorota": "994-EC1 CE MARANGUAPE SAT 2"
  },
  {
    "cep": "61991975",
    "descricaorota": "994-EC1 CE MARANGUAPE SAT 2"
  },
  {
    "cep": "62000",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Sobral"
  },
  {
    "cep": "62010",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62010"
  },
  {
    "cep": "62010100",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62010293",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62010305",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62010310",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62010370",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62011",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62011"
  },
  {
    "cep": "62011063",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62014",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62014"
  },
  {
    "cep": "62014020",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62016",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62016"
  },
  {
    "cep": "62016120",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62016190",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62021",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62021"
  },
  {
    "cep": "62021062",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62022",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62022"
  },
  {
    "cep": "62022290",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62022304",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62022360",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62022445",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62022455",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62030",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62030"
  },
  {
    "cep": "62030175",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62030210",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62030230",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62030290",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62030362",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62031",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62031"
  },
  {
    "cep": "62031130",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62031140",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62031195",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62033",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62033"
  },
  {
    "cep": "62033010",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62033260",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62033565",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62040",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62040"
  },
  {
    "cep": "62040520",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62050",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62050"
  },
  {
    "cep": "62050570",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62050700",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62050710",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62050740",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62051",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62051"
  },
  {
    "cep": "62051090",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62051160",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62051172",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62053",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62053"
  },
  {
    "cep": "62053705",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62053765",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62053850",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62108",
    "descricaorota": "994-EC1 CE SOBRAL SAT 2",
    "cidade": "Região Prefix 62108"
  },
  {
    "cep": "62108000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 2"
  },
  {
    "cep": "62113",
    "descricaorota": "994-EC1 CE SOBRAL SAT 3",
    "cidade": "Região Prefix 62113"
  },
  {
    "cep": "62113000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 3"
  },
  {
    "cep": "62114",
    "descricaorota": "994-EC1 CE SOBRAL SAT 3",
    "cidade": "Região Prefix 62114"
  },
  {
    "cep": "62114000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 3"
  },
  {
    "cep": "62114400",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62115",
    "descricaorota": "994-EC1 CE SOBRAL SAT 5",
    "cidade": "Região Prefix 62115"
  },
  {
    "cep": "62115000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 5"
  },
  {
    "cep": "62119",
    "descricaorota": "994-EC1 CE SOBRAL SAT 4",
    "cidade": "Região Prefix 62119"
  },
  {
    "cep": "62119000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 4"
  },
  {
    "cep": "62120",
    "descricaorota": "994-EC1 CE SOBRAL SAT 2",
    "cidade": "Região Prefix 62120"
  },
  {
    "cep": "62120000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 2"
  },
  {
    "cep": "62140",
    "descricaorota": "994-EC1 CE SOBRAL SAT 1",
    "cidade": "Região Prefix 62140"
  },
  {
    "cep": "62140000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 1"
  },
  {
    "cep": "62160",
    "descricaorota": "994-EC1 CE TIANGUA",
    "cidade": "Região Prefix 62160"
  },
  {
    "cep": "62160000",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62168",
    "descricaorota": "994-EC1 CE SOBRAL SAT 3",
    "cidade": "Região Prefix 62168"
  },
  {
    "cep": "62168000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 3"
  },
  {
    "cep": "62184",
    "descricaorota": "994-EC1 CE SOBRAL",
    "cidade": "Região Prefix 62184"
  },
  {
    "cep": "62184000",
    "descricaorota": "994-EC1 CE SOBRAL"
  },
  {
    "cep": "62190",
    "descricaorota": "994-EC1 CE SOBRAL SAT 4",
    "cidade": "Região Prefix 62190"
  },
  {
    "cep": "62190000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 4"
  },
  {
    "cep": "62200",
    "descricaorota": "994-EC1 CE CRATEUS SAT 3",
    "cidade": "Região Prefix 62200"
  },
  {
    "cep": "62200000",
    "descricaorota": "994-EC1 CE CRATEUS SAT 3"
  },
  {
    "cep": "62215",
    "descricaorota": "994-EC1 CE CRATEUS SAT 3",
    "cidade": "Região Prefix 62215"
  },
  {
    "cep": "62215000",
    "descricaorota": "994-EC1 CE CRATEUS SAT 3"
  },
  {
    "cep": "62220",
    "descricaorota": "994-EC1 CE CRATEUS SAT 3",
    "cidade": "Região Prefix 62220"
  },
  {
    "cep": "62220000",
    "descricaorota": "994-EC1 CE CRATEUS SAT 3"
  },
  {
    "cep": "62260",
    "descricaorota": "994-EC1 CE SOBRAL SAT 4",
    "cidade": "Região Prefix 62260"
  },
  {
    "cep": "62260000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 4"
  },
  {
    "cep": "62265",
    "descricaorota": "994-EC1 CE SANTA QUITERIA SAT 2",
    "cidade": "Região Prefix 62265"
  },
  {
    "cep": "62265000",
    "descricaorota": "994-EC1 CE SANTA QUITERIA SAT 2"
  },
  {
    "cep": "62270",
    "descricaorota": "994-EC1 CE SANTA QUITERIA",
    "cidade": "Catunda / Sta Quitéria"
  },
  {
    "cep": "62273",
    "descricaorota": "994-EC1 CE SANTA QUITERIA",
    "cidade": "Região Prefix 62273"
  },
  {
    "cep": "62273000",
    "descricaorota": "994-EC1 CE SANTA QUITERIA"
  },
  {
    "cep": "62280",
    "descricaorota": "994-EC1 CE SANTA QUITERIA",
    "cidade": "Região Prefix 62280"
  },
  {
    "cep": "62280000",
    "descricaorota": "994-EC1 CE SANTA QUITERIA"
  },
  {
    "cep": "62285",
    "descricaorota": "994-EC1 CE SANTA QUITERIA",
    "cidade": "Varjota / Sta Quitéria"
  },
  {
    "cep": "62294",
    "descricaorota": "994-EC1 CE SOBRAL SAT 4",
    "cidade": "Região Prefix 62294"
  },
  {
    "cep": "62294000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 4"
  },
  {
    "cep": "62297",
    "descricaorota": "994-EC1 CE SANTA QUITERIA SAT 4",
    "cidade": "Região Prefix 62297"
  },
  {
    "cep": "62297000",
    "descricaorota": "994-EC1 CE SANTA QUITERIA SAT 4"
  },
  {
    "cep": "62299",
    "descricaorota": "994-EC1 CE SANTA QUITERIA SAT 4",
    "cidade": "Região Prefix 62299"
  },
  {
    "cep": "62299000",
    "descricaorota": "994-EC1 CE SANTA QUITERIA SAT 4"
  },
  {
    "cep": "62300",
    "descricaorota": "994-EC1 CE TIANGUA SAT 1",
    "cidade": "Região Prefix 62300"
  },
  {
    "cep": "62300000",
    "descricaorota": "994-EC1 CE TIANGUA SAT 1"
  },
  {
    "cep": "62320",
    "descricaorota": "994-EC1 CE TIANGUA",
    "cidade": "Região Prefix 62320"
  },
  {
    "cep": "62320053",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62320057",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62320230",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62320250",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62320270",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62320340",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62320353",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62320462",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62322",
    "descricaorota": "994-EC1 CE TIANGUA",
    "cidade": "Região Prefix 62322"
  },
  {
    "cep": "62322010",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62322110",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62322360",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62322660",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62322700",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62325",
    "descricaorota": "994-EC1 CE TIANGUA",
    "cidade": "Região Prefix 62325"
  },
  {
    "cep": "62325350",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62326",
    "descricaorota": "994-EC1 CE TIANGUA",
    "cidade": "Região Prefix 62326"
  },
  {
    "cep": "62326515",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62327",
    "descricaorota": "994-EC1 CE TIANGUA",
    "cidade": "Região Prefix 62327"
  },
  {
    "cep": "62327010",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62327315",
    "descricaorota": "994-EC1 CE TIANGUA SAT 2"
  },
  {
    "cep": "62329",
    "descricaorota": "994-EC1 CE TIANGUA",
    "cidade": "Região Prefix 62329"
  },
  {
    "cep": "62329899",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62330",
    "descricaorota": "994-EC1 CE TIANGUA",
    "cidade": "Região Prefix 62330"
  },
  {
    "cep": "62330000",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62334",
    "descricaorota": "994-EC1 CE TIANGUA SAT 1",
    "cidade": "Região Prefix 62334"
  },
  {
    "cep": "62334000",
    "descricaorota": "994-EC1 CE TIANGUA SAT 1"
  },
  {
    "cep": "62337",
    "descricaorota": "994-EC1 CE TIANGUA",
    "cidade": "Região Prefix 62337"
  },
  {
    "cep": "62337000",
    "descricaorota": "994-EC1 CE TIANGUA"
  },
  {
    "cep": "62340",
    "descricaorota": "994-EC1 CE TIANGUA SAT 3",
    "cidade": "Região Prefix 62340"
  },
  {
    "cep": "62340000",
    "descricaorota": "994-EC1 CE TIANGUA SAT 3"
  },
  {
    "cep": "62350",
    "descricaorota": "994-EC1 CE TIANGUA SAT 3",
    "cidade": "Região Prefix 62350"
  },
  {
    "cep": "62350000",
    "descricaorota": "994-EC1 CE TIANGUA SAT 3"
  },
  {
    "cep": "62360",
    "descricaorota": "994-EC1 CE TIANGUA SAT 3",
    "cidade": "Região Prefix 62360"
  },
  {
    "cep": "62360000",
    "descricaorota": "994-EC1 CE TIANGUA SAT 3"
  },
  {
    "cep": "62370",
    "descricaorota": "994-EC1 CE TIANGUA SAT 4",
    "cidade": "Região Prefix 62370"
  },
  {
    "cep": "62370000",
    "descricaorota": "994-EC1 CE TIANGUA SAT 4"
  },
  {
    "cep": "62375",
    "descricaorota": "994-EC1 CE TIANGUA SAT 4",
    "cidade": "Região Prefix 62375"
  },
  {
    "cep": "62375000",
    "descricaorota": "994-EC1 CE TIANGUA SAT 4"
  },
  {
    "cep": "62380",
    "descricaorota": "994-EC1 CE TIANGUA SAT 4",
    "cidade": "Região Prefix 62380"
  },
  {
    "cep": "62380000",
    "descricaorota": "994-EC1 CE TIANGUA SAT 4"
  },
  {
    "cep": "62400",
    "descricaorota": "994-EC1 CE CAMOCIM",
    "cidade": "Região Prefix 62400"
  },
  {
    "cep": "62400000",
    "descricaorota": "994-EC1 CE CAMOCIM"
  },
  {
    "cep": "62410",
    "descricaorota": "994-EC1 CE CAMOCIM SAT 1",
    "cidade": "Região Prefix 62410"
  },
  {
    "cep": "62410000",
    "descricaorota": "994-EC1 CE CAMOCIM SAT 1"
  },
  {
    "cep": "62414",
    "descricaorota": "994-EC1 CE CAMOCIM SAT 1",
    "cidade": "Barroquinha / Camocim"
  },
  {
    "cep": "62420",
    "descricaorota": "994-EC1 CE CAMOCIM SAT 1",
    "cidade": "Região Prefix 62420"
  },
  {
    "cep": "62420000",
    "descricaorota": "994-EC1 CE CAMOCIM SAT 1"
  },
  {
    "cep": "62430",
    "descricaorota": "994-EC1 CE CAMOCIM SAT 2",
    "cidade": "Região Prefix 62430"
  },
  {
    "cep": "62430000",
    "descricaorota": "994-EC1 CE CAMOCIM SAT 2"
  },
  {
    "cep": "62450",
    "descricaorota": "994-EC1 CE CAMOCIM SAT 2",
    "cidade": "Granja / Camocim"
  },
  {
    "cep": "62470",
    "descricaorota": "994-EC1 CE SOBRAL SAT 1",
    "cidade": "Região Prefix 62470"
  },
  {
    "cep": "62470000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 1"
  },
  {
    "cep": "62500",
    "descricaorota": "994-EC1 CE ITAPIPOCA",
    "cidade": "Região Prefix 62500"
  },
  {
    "cep": "62500001",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62500007",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62500075",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62500290",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62500385",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62500450",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62500970",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62501",
    "descricaorota": "994-EC1 CE ITAPIPOCA",
    "cidade": "Região Prefix 62501"
  },
  {
    "cep": "62501190",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62502",
    "descricaorota": "994-EC1 CE ITAPIPOCA",
    "cidade": "Região Prefix 62502"
  },
  {
    "cep": "62502364",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62502380",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62502448",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62502620",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62503",
    "descricaorota": "994-EC1 CE ITAPIPOCA",
    "cidade": "Região Prefix 62503"
  },
  {
    "cep": "62503000",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62503222",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62503230",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62503310",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62503390",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62503490",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62504",
    "descricaorota": "994-EC1 CE ITAPIPOCA",
    "cidade": "Região Prefix 62504"
  },
  {
    "cep": "62504010",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62504015",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62504035",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62504045",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62504055",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62504090",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62504174",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62504326",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62504695",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62507",
    "descricaorota": "994-EC1 CE ITAPIPOCA",
    "cidade": "Região Prefix 62507"
  },
  {
    "cep": "62507075",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62507080",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62507415",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62508",
    "descricaorota": "994-EC1 CE ITAPIPOCA",
    "cidade": "Região Prefix 62508"
  },
  {
    "cep": "62508024",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62508060",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62508066",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62508370",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62508620",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62508635",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62508715",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62508730",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62511",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 4",
    "cidade": "Região Prefix 62511"
  },
  {
    "cep": "62511000",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 4"
  },
  {
    "cep": "62512",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 4",
    "cidade": "Região Prefix 62512"
  },
  {
    "cep": "62512000",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 4"
  },
  {
    "cep": "62515",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 2",
    "cidade": "Região Prefix 62515"
  },
  {
    "cep": "62515000",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 2"
  },
  {
    "cep": "62525",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 1",
    "cidade": "Região Prefix 62525"
  },
  {
    "cep": "62525000",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 1"
  },
  {
    "cep": "62530",
    "descricaorota": "994-EC1 CE SOBRAL SAT 6",
    "cidade": "Região Prefix 62530"
  },
  {
    "cep": "62530000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 6"
  },
  {
    "cep": "62540",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 1",
    "cidade": "Região Prefix 62540"
  },
  {
    "cep": "62540000",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 1"
  },
  {
    "cep": "62550",
    "descricaorota": "994-EC1 CE SOBRAL SAT 6",
    "cidade": "Região Prefix 62550"
  },
  {
    "cep": "62550000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 6"
  },
  {
    "cep": "62559",
    "descricaorota": "994-EC1 CE SOBRAL SAT 6",
    "cidade": "Região Prefix 62559"
  },
  {
    "cep": "62559000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 6"
  },
  {
    "cep": "62570",
    "descricaorota": "994-EC1 CE ACARAU SAT 3",
    "cidade": "Região Prefix 62570"
  },
  {
    "cep": "62570000",
    "descricaorota": "994-EC1 CE ACARAU SAT 3"
  },
  {
    "cep": "62580",
    "descricaorota": "994-EC1 CE ACARAU",
    "cidade": "Região Prefix 62580"
  },
  {
    "cep": "62580000",
    "descricaorota": "994-EC1 CE ACARAU"
  },
  {
    "cep": "62583",
    "descricaorota": "994-EC1 CE ACARAU SAT 3",
    "cidade": "Região Prefix 62583"
  },
  {
    "cep": "62583000",
    "descricaorota": "994-EC1 CE ACARAU SAT 3"
  },
  {
    "cep": "62584",
    "descricaorota": "994-EC1 CE ACARAU SAT 1",
    "cidade": "Região Prefix 62584"
  },
  {
    "cep": "62584000",
    "descricaorota": "994-EC1 CE ACARAU SAT 1"
  },
  {
    "cep": "62585",
    "descricaorota": "994-EC1 CE ACARAU SAT 2",
    "cidade": "Região Prefix 62585"
  },
  {
    "cep": "62585000",
    "descricaorota": "994-EC1 CE ACARAU SAT 2"
  },
  {
    "cep": "62590",
    "descricaorota": "994-EC1 CE ACARAU SAT 1",
    "cidade": "Região Prefix 62590"
  },
  {
    "cep": "62590000",
    "descricaorota": "994-EC1 CE ACARAU SAT 1"
  },
  {
    "cep": "62595",
    "descricaorota": "994-EC1 CE ACARAU SAT 2",
    "cidade": "Região Prefix 62595"
  },
  {
    "cep": "62595000",
    "descricaorota": "994-EC1 CE ACARAU SAT 2"
  },
  {
    "cep": "62600",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 4",
    "cidade": "Região Prefix 62600"
  },
  {
    "cep": "62600000",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 4"
  },
  {
    "cep": "62620",
    "descricaorota": "994-EC1 CE SOBRAL SAT 5",
    "cidade": "Região Prefix 62620"
  },
  {
    "cep": "62620000",
    "descricaorota": "994-EC1 CE SOBRAL SAT 5"
  },
  {
    "cep": "62650",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 4",
    "cidade": "Região Prefix 62650"
  },
  {
    "cep": "62650000",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 4"
  },
  {
    "cep": "62655",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 3",
    "cidade": "Região Prefix 62655"
  },
  {
    "cep": "62655000",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 3"
  },
  {
    "cep": "62660",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 3",
    "cidade": "Região Prefix 62660"
  },
  {
    "cep": "62660000",
    "descricaorota": "994-EC1 CE ITAPIPOCA SAT 3"
  },
  {
    "cep": "62670",
    "descricaorota": "994-EC1 CE CAUCAIA SAT 2",
    "cidade": "Região Prefix 62670"
  },
  {
    "cep": "62670000",
    "descricaorota": "994-EC1 CE CAUCAIA SAT 2"
  },
  {
    "cep": "62675",
    "descricaorota": "994-EC1 CE CAUCAIA SAT 2",
    "cidade": "Região Prefix 62675"
  },
  {
    "cep": "62675000",
    "descricaorota": "994-EC1 CE CAUCAIA SAT 2"
  },
  {
    "cep": "62677",
    "descricaorota": "994-EC1 CE CAUCAIA SAT 2",
    "cidade": "Região Prefix 62677"
  },
  {
    "cep": "62677000",
    "descricaorota": "994-EC1 CE CAUCAIA SAT 2"
  },
  {
    "cep": "62690",
    "descricaorota": "994-EC1 CE ITAPIPOCA",
    "cidade": "Região Prefix 62690"
  },
  {
    "cep": "62690000",
    "descricaorota": "994-EC1 CE ITAPIPOCA"
  },
  {
    "cep": "62700",
    "descricaorota": "994-EC1 CE CANINDE",
    "cidade": "Região Prefix 62700"
  },
  {
    "cep": "62700000",
    "descricaorota": "994-EC1 CE CANINDE"
  },
  {
    "cep": "62720",
    "descricaorota": "994-EC1 CE CANINDE",
    "cidade": "Região Prefix 62720"
  },
  {
    "cep": "62720000",
    "descricaorota": "994-EC1 CE CANINDE"
  },
  {
    "cep": "62725",
    "descricaorota": "994-EC1 CE CANINDE",
    "cidade": "Região Prefix 62725"
  },
  {
    "cep": "62725000",
    "descricaorota": "994-EC1 CE CANINDE"
  },
  {
    "cep": "62730",
    "descricaorota": "994-EC1 CE CANINDE",
    "cidade": "Região Prefix 62730"
  },
  {
    "cep": "62730000",
    "descricaorota": "994-EC1 CE CANINDE"
  },
  {
    "cep": "62734",
    "descricaorota": "994-EC1 CE CANINDE SAT 2",
    "cidade": "Região Prefix 62734"
  },
  {
    "cep": "62734000",
    "descricaorota": "994-EC1 CE CANINDE SAT 2"
  },
  {
    "cep": "62736",
    "descricaorota": "994-EC1 CE CANINDE SAT 2",
    "cidade": "Região Prefix 62736"
  },
  {
    "cep": "62736000",
    "descricaorota": "994-EC1 CE CANINDE SAT 2"
  },
  {
    "cep": "62742",
    "descricaorota": "994-EC1 CE QUIXADA SAT 1",
    "cidade": "Região Prefix 62742"
  },
  {
    "cep": "62742000",
    "descricaorota": "994-EC1 CE QUIXADA SAT 1"
  },
  {
    "cep": "62750",
    "descricaorota": "994-EC1 CE CANINDE SAT 1",
    "cidade": "Aratuba / Canindé"
  },
  {
    "cep": "62755",
    "descricaorota": "994-EC1 CE PACAJUS SAT 2",
    "cidade": "Região Prefix 62755"
  },
  {
    "cep": "62755000",
    "descricaorota": "994-EC1 CE PACAJUS SAT 2"
  },
  {
    "cep": "62760",
    "descricaorota": "994-EC1 CE CANINDE SAT 2",
    "cidade": "Baturité / Canindé"
  },
  {
    "cep": "62762",
    "descricaorota": "994-EC1 CE CANINDE SAT 2",
    "cidade": "Região Prefix 62762"
  },
  {
    "cep": "62762000",
    "descricaorota": "994-EC1 CE CANINDE SAT 2"
  },
  {
    "cep": "62764",
    "descricaorota": "994-EC1 CE CANINDE SAT 2",
    "cidade": "Guaramiranga / Canindé"
  },
  {
    "cep": "62780",
    "descricaorota": "994-EC1 CE MARANGUAPE SAT 1",
    "cidade": "Região Prefix 62780"
  },
  {
    "cep": "62780000",
    "descricaorota": "994-EC1 CE MARANGUAPE SAT 1"
  },
  {
    "cep": "62785",
    "descricaorota": "994-EC1 CE PACAJUS SAT 3",
    "cidade": "Região Prefix 62785"
  },
  {
    "cep": "62785000",
    "descricaorota": "994-EC1 CE PACAJUS SAT 3"
  },
  {
    "cep": "62790",
    "descricaorota": "994-EC1 CE PACAJUS SAT 3",
    "cidade": "Região Prefix 62790"
  },
  {
    "cep": "62790000",
    "descricaorota": "994-EC1 CE PACAJUS SAT 3"
  },
  {
    "cep": "62795",
    "descricaorota": "994-EC1 CE PACAJUS SAT 3",
    "cidade": "Região Prefix 62795"
  },
  {
    "cep": "62795000",
    "descricaorota": "994-EC1 CE PACAJUS SAT 3"
  },
  {
    "cep": "62800",
    "descricaorota": "994-EC1 CE ARACATI",
    "cidade": "Região Prefix 62800"
  },
  {
    "cep": "62800000",
    "descricaorota": "994-EC1 CE ARACATI"
  },
  {
    "cep": "62800009",
    "descricaorota": "994-EC1 CE ARACATI"
  },
  {
    "cep": "62800029",
    "descricaorota": "994-EC1 CE ARACATI"
  },
  {
    "cep": "62800396",
    "descricaorota": "994-EC1 CE ARACATI"
  },
  {
    "cep": "62800418",
    "descricaorota": "994-EC1 CE ARACATI"
  },
  {
    "cep": "62800482",
    "descricaorota": "994-EC1 CE ARACATI"
  },
  {
    "cep": "62800590",
    "descricaorota": "994-EC1 CE ARACATI"
  },
  {
    "cep": "62800970",
    "descricaorota": "994-EC1 CE ARACATI"
  },
  {
    "cep": "62801",
    "descricaorota": "994-EC1 CE ARACATI",
    "cidade": "Região Prefix 62801"
  },
  {
    "cep": "62801102",
    "descricaorota": "994-EC1 CE ARACATI"
  },
  {
    "cep": "62803",
    "descricaorota": "994-EC1 CE ARACATI SAT 2",
    "cidade": "Região Prefix 62803"
  },
  {
    "cep": "62803176",
    "descricaorota": "994-EC1 CE ARACATI SAT 2"
  },
  {
    "cep": "62804",
    "descricaorota": "994-EC1 CE ARACATI SAT 2",
    "cidade": "Região Prefix 62804"
  },
  {
    "cep": "62804592",
    "descricaorota": "994-EC1 CE ARACATI"
  },
  {
    "cep": "62804618",
    "descricaorota": "994-EC1 CE ARACATI SAT 2"
  },
  {
    "cep": "62806",
    "descricaorota": "994-EC1 CE ARACATI",
    "cidade": "Região Prefix 62806"
  },
  {
    "cep": "62806899",
    "descricaorota": "994-EC1 CE ARACATI"
  },
  {
    "cep": "62810",
    "descricaorota": "994-EC1 CE ARACATI SAT 6",
    "cidade": "Região Prefix 62810"
  },
  {
    "cep": "62810000",
    "descricaorota": "994-EC1 CE ARACATI SAT 6"
  },
  {
    "cep": "62815",
    "descricaorota": "994-EC1 CE ARACATI SAT 1",
    "cidade": "Região Prefix 62815"
  },
  {
    "cep": "62815000",
    "descricaorota": "994-EC1 CE ARACATI SAT 1"
  },
  {
    "cep": "62823",
    "descricaorota": "994-EC1 CE ARACATI SAT 2",
    "cidade": "Região Prefix 62823"
  },
  {
    "cep": "62823000",
    "descricaorota": "994-EC1 CE ARACATI SAT 2"
  },
  {
    "cep": "62840",
    "descricaorota": "994-EC1 CE CASCAVEL SAT 1",
    "cidade": "Região Prefix 62840"
  },
  {
    "cep": "62840000",
    "descricaorota": "994-EC1 CE CASCAVEL SAT 1"
  },
  {
    "cep": "62846",
    "descricaorota": "994-EC1 CE CASCAVEL SAT 1",
    "cidade": "Região Prefix 62846"
  },
  {
    "cep": "62846000",
    "descricaorota": "994-EC1 CE CASCAVEL SAT 1"
  },
  {
    "cep": "62848",
    "descricaorota": "994-EC1 CE CASCAVEL SAT 1",
    "cidade": "Região Prefix 62848"
  },
  {
    "cep": "62848000",
    "descricaorota": "994-EC1 CE CASCAVEL SAT 1"
  },
  {
    "cep": "62850",
    "descricaorota": "994-EC1 CE CASCAVEL",
    "cidade": "Região Prefix 62850"
  },
  {
    "cep": "62850000",
    "descricaorota": "994-EC1 CE CASCAVEL"
  },
  {
    "cep": "62860",
    "descricaorota": "994-EC1 CE CASCAVEL SAT 3",
    "cidade": "Região Prefix 62860"
  },
  {
    "cep": "62860000",
    "descricaorota": "994-EC1 CE CASCAVEL SAT 3"
  },
  {
    "cep": "62870",
    "descricaorota": "994-EC1 CE PACAJUS",
    "cidade": "Região Prefix 62870"
  },
  {
    "cep": "62870000",
    "descricaorota": "994-EC1 CE PACAJUS"
  },
  {
    "cep": "62875",
    "descricaorota": "994-EC1 CE PACAJUS SAT 2",
    "cidade": "Região Prefix 62875"
  },
  {
    "cep": "62875000",
    "descricaorota": "994-EC1 CE PACAJUS SAT 2"
  },
  {
    "cep": "62880",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1",
    "cidade": "Região Prefix 62880"
  },
  {
    "cep": "62880025",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62880542",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62882",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1",
    "cidade": "Região Prefix 62882"
  },
  {
    "cep": "62882040",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62882450",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62882574",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62882650",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62883",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1",
    "cidade": "Região Prefix 62883"
  },
  {
    "cep": "62883101",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62884",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1",
    "cidade": "Região Prefix 62884"
  },
  {
    "cep": "62884050",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62884610",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62884830",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62884855",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62885",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1",
    "cidade": "Região Prefix 62885"
  },
  {
    "cep": "62885462",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62886",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1",
    "cidade": "Região Prefix 62886"
  },
  {
    "cep": "62886645",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62887",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1",
    "cidade": "Região Prefix 62887"
  },
  {
    "cep": "62887467",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62898",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1",
    "cidade": "Região Prefix 62898"
  },
  {
    "cep": "62898000",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62899",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1",
    "cidade": "Região Prefix 62899"
  },
  {
    "cep": "62899000",
    "descricaorota": "994-EC1 CE PACAJUS SAT 1"
  },
  {
    "cep": "62900",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 3",
    "cidade": "Região Prefix 62900"
  },
  {
    "cep": "62900023",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 3"
  },
  {
    "cep": "62901",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 3",
    "cidade": "Região Prefix 62901"
  },
  {
    "cep": "62901242",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 3"
  },
  {
    "cep": "62903",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE",
    "cidade": "Região Prefix 62903"
  },
  {
    "cep": "62903731",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE"
  },
  {
    "cep": "62904",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 3",
    "cidade": "Região Prefix 62904"
  },
  {
    "cep": "62904088",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 3"
  },
  {
    "cep": "62908",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 3",
    "cidade": "Região Prefix 62908"
  },
  {
    "cep": "62908500",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 3"
  },
  {
    "cep": "62920",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 2",
    "cidade": "Região Prefix 62920"
  },
  {
    "cep": "62920000",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 2"
  },
  {
    "cep": "62930",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE",
    "cidade": "Região Prefix 62930"
  },
  {
    "cep": "62930000",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE"
  },
  {
    "cep": "62930069",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE"
  },
  {
    "cep": "62930073",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE"
  },
  {
    "cep": "62934",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE",
    "cidade": "Região Prefix 62934"
  },
  {
    "cep": "62934204",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE"
  },
  {
    "cep": "62934318",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE"
  },
  {
    "cep": "62937",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE",
    "cidade": "Região Prefix 62937"
  },
  {
    "cep": "62937899",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE"
  },
  {
    "cep": "62940",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 5",
    "cidade": "Região Prefix 62940"
  },
  {
    "cep": "62940000",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 5"
  },
  {
    "cep": "62955",
    "descricaorota": "994-EC1 CE QUIXADA SAT 4",
    "cidade": "Região Prefix 62955"
  },
  {
    "cep": "62955000",
    "descricaorota": "994-EC1 CE QUIXADA SAT 4"
  },
  {
    "cep": "62962",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE",
    "cidade": "Região Prefix 62962"
  },
  {
    "cep": "62962039",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE"
  },
  {
    "cep": "62963",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 1",
    "cidade": "Região Prefix 62963"
  },
  {
    "cep": "62963012",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 1"
  },
  {
    "cep": "62965",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 6",
    "cidade": "Região Prefix 62965"
  },
  {
    "cep": "62965000",
    "descricaorota": "994-EC1 CE LIMOEIRO DO NORTE SAT 6"
  },
  {
    "cep": "63000",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Juazeiro do Norte"
  },
  {
    "cep": "63010",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63010"
  },
  {
    "cep": "63010000",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63010010",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63010302",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63013",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63013"
  },
  {
    "cep": "63013090",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63015",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Juazeiro do Norte"
  },
  {
    "cep": "63018",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63018"
  },
  {
    "cep": "63018040",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63020",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63020"
  },
  {
    "cep": "63020025",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63020050",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63020060",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63020190",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63020350",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63024",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63024"
  },
  {
    "cep": "63024030",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63024375",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63024610",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63024772",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63028",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63028"
  },
  {
    "cep": "63028310",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63028370",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63030",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63030"
  },
  {
    "cep": "63030075",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63030175",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63030300",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63030330",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63030340",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63030390",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63031",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63031"
  },
  {
    "cep": "63031015",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63031280",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63031290",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63031620",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63033",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63033"
  },
  {
    "cep": "63033030",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63033220",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63035",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63035"
  },
  {
    "cep": "63035030",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63035090",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63035175",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63036",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63036"
  },
  {
    "cep": "63036230",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63038",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63038"
  },
  {
    "cep": "63038440",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63040",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63040"
  },
  {
    "cep": "63040650",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63041",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63041"
  },
  {
    "cep": "63041010",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63041050",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63041145",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63042",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63042"
  },
  {
    "cep": "63042030",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63043",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63043"
  },
  {
    "cep": "63043100",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63043270",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63043280",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63043560",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63046",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63046"
  },
  {
    "cep": "63046150",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63046450",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63046460",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63047",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63047"
  },
  {
    "cep": "63047501",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63048",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63048"
  },
  {
    "cep": "63048245",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63049",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63049"
  },
  {
    "cep": "63049160",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63049300",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63050",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63050"
  },
  {
    "cep": "63050163",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63050180",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63050310",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63050322",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63050325",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63050400",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63050600",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63051",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63051"
  },
  {
    "cep": "63051030",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63051040",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63051130",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63051135",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63051150",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63051165",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63051170",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63051220",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63090",
    "descricaorota": "994-EC1 CE BARBALHA",
    "cidade": "Região Prefix 63090"
  },
  {
    "cep": "63090009",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63090118",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63090204",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE SAT 1"
  },
  {
    "cep": "63090232",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63090520",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63090694",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63090970",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63091",
    "descricaorota": "994-EC1 CE BARBALHA",
    "cidade": "Região Prefix 63091"
  },
  {
    "cep": "63091014",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63092",
    "descricaorota": "994-EC1 CE BARBALHA",
    "cidade": "Região Prefix 63092"
  },
  {
    "cep": "63092172",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63092230",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63092250",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63093",
    "descricaorota": "994-EC1 CE BARBALHA",
    "cidade": "Região Prefix 63093"
  },
  {
    "cep": "63093018",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63093118",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63094",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE",
    "cidade": "Região Prefix 63094"
  },
  {
    "cep": "63094004",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63095",
    "descricaorota": "994-EC1 CE BARBALHA",
    "cidade": "Região Prefix 63095"
  },
  {
    "cep": "63095296",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63095314",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63095498",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE SAT 1"
  },
  {
    "cep": "63096",
    "descricaorota": "994-EC1 CE BARBALHA",
    "cidade": "Região Prefix 63096"
  },
  {
    "cep": "63096899",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63097",
    "descricaorota": "994-EC1 CE BARBALHA",
    "cidade": "Região Prefix 63097"
  },
  {
    "cep": "63097000",
    "descricaorota": "994-EC1 CE BARBALHA"
  },
  {
    "cep": "63099",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE SAT 1",
    "cidade": "Região Prefix 63099"
  },
  {
    "cep": "63099000",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE SAT 1"
  },
  {
    "cep": "63100",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63100"
  },
  {
    "cep": "63100065",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63100080",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63100390",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63100640",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63101",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63101"
  },
  {
    "cep": "63101065",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63101075",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63102",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63102"
  },
  {
    "cep": "63102230",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63104",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63104"
  },
  {
    "cep": "63104120",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63105",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63105"
  },
  {
    "cep": "63105000",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63108",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63108"
  },
  {
    "cep": "63108030",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63112",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63112"
  },
  {
    "cep": "63112042",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63113",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63113"
  },
  {
    "cep": "63113092",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63113190",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63113370",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63113640",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE"
  },
  {
    "cep": "63115",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63115"
  },
  {
    "cep": "63115035",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63115470",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63118",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63118"
  },
  {
    "cep": "63118270",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63119",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63119"
  },
  {
    "cep": "63119160",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63119210",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63119440",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63120",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Crato"
  },
  {
    "cep": "63122",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63122"
  },
  {
    "cep": "63122095",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63122146",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63122330",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63122375",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63122435",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63123",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63123"
  },
  {
    "cep": "63123167",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63123300",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63123312",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63123348",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63125",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63125"
  },
  {
    "cep": "63125085",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63125205",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63130",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63130"
  },
  {
    "cep": "63130456",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63132",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63132"
  },
  {
    "cep": "63132080",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63135",
    "descricaorota": "994-EC1 CE CRATO",
    "cidade": "Região Prefix 63135"
  },
  {
    "cep": "63135899",
    "descricaorota": "994-EC1 CE CRATO"
  },
  {
    "cep": "63140",
    "descricaorota": "994-EC1 CE BARBALHA",
    "cidade": "Barbalha"
  },
  {
    "cep": "63165",
    "descricaorota": "994-EC1 CE CRATO SAT 2",
    "cidade": "Região Prefix 63165"
  },
  {
    "cep": "63165000",
    "descricaorota": "994-EC1 CE CRATO SAT 2"
  },
  {
    "cep": "63185",
    "descricaorota": "994-EC1 CE CRATO SAT 1",
    "cidade": "Região Prefix 63185"
  },
  {
    "cep": "63185000",
    "descricaorota": "994-EC1 CE CRATO SAT 1"
  },
  {
    "cep": "63190",
    "descricaorota": "994-EC1 CE CRATO SAT 2",
    "cidade": "Região Prefix 63190"
  },
  {
    "cep": "63190000",
    "descricaorota": "994-EC1 CE CRATO SAT 2"
  },
  {
    "cep": "63195",
    "descricaorota": "994-EC1 CE CRATO SAT 2",
    "cidade": "Região Prefix 63195"
  },
  {
    "cep": "63195000",
    "descricaorota": "994-EC1 CE CRATO SAT 2"
  },
  {
    "cep": "63200",
    "descricaorota": "994-EC1 CE BARBALHA SAT 2",
    "cidade": "Região Prefix 63200"
  },
  {
    "cep": "63200000",
    "descricaorota": "994-EC1 CE BARBALHA SAT 2"
  },
  {
    "cep": "63207",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 3",
    "cidade": "Região Prefix 63207"
  },
  {
    "cep": "63207000",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 3"
  },
  {
    "cep": "63210",
    "descricaorota": "994-EC1 CE BREJO SANTO",
    "cidade": "Região Prefix 63210"
  },
  {
    "cep": "63210000",
    "descricaorota": "994-EC1 CE BREJO SANTO"
  },
  {
    "cep": "63220",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE SAT 1",
    "cidade": "Região Prefix 63220"
  },
  {
    "cep": "63220000",
    "descricaorota": "994-EC1 CE JUAZ DO NORTE SAT 1"
  },
  {
    "cep": "63240",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 3",
    "cidade": "Região Prefix 63240"
  },
  {
    "cep": "63240000",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 3"
  },
  {
    "cep": "63250",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 2",
    "cidade": "Região Prefix 63250"
  },
  {
    "cep": "63250000",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 2"
  },
  {
    "cep": "63260",
    "descricaorota": "994-EC1 CE BREJO SANTO",
    "cidade": "Região Prefix 63260"
  },
  {
    "cep": "63260000",
    "descricaorota": "994-EC1 CE BREJO SANTO"
  },
  {
    "cep": "63270",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 4",
    "cidade": "Região Prefix 63270"
  },
  {
    "cep": "63270000",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 4"
  },
  {
    "cep": "63275",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 5",
    "cidade": "Região Prefix 63275"
  },
  {
    "cep": "63275000",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 5"
  },
  {
    "cep": "63280",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 5",
    "cidade": "Região Prefix 63280"
  },
  {
    "cep": "63280000",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 5"
  },
  {
    "cep": "63290",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 4",
    "cidade": "Região Prefix 63290"
  },
  {
    "cep": "63290000",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 4"
  },
  {
    "cep": "63310",
    "descricaorota": "994-EC1 CE ICO SAT 6",
    "cidade": "Região Prefix 63310"
  },
  {
    "cep": "63310000",
    "descricaorota": "994-EC1 CE ICO SAT 6"
  },
  {
    "cep": "63380",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 2",
    "cidade": "Região Prefix 63380"
  },
  {
    "cep": "63380000",
    "descricaorota": "994-EC1 CE BREJO SANTO SAT 2"
  },
  {
    "cep": "63400",
    "descricaorota": "994-EC1 CE IGUATU SAT 3",
    "cidade": "Região Prefix 63400"
  },
  {
    "cep": "63400000",
    "descricaorota": "994-EC1 CE IGUATU SAT 3"
  },
  {
    "cep": "63430",
    "descricaorota": "994-EC1 CE ICO",
    "cidade": "Região Prefix 63430"
  },
  {
    "cep": "63430000",
    "descricaorota": "994-EC1 CE ICO"
  },
  {
    "cep": "63500",
    "descricaorota": "994-EC1 CE IGUATU",
    "cidade": "Região Prefix 63500"
  },
  {
    "cep": "63500029",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63500056",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63500113",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63500630",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63502",
    "descricaorota": "994-EC1 CE IGUATU",
    "cidade": "Região Prefix 63502"
  },
  {
    "cep": "63502225",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63502240",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63503",
    "descricaorota": "994-EC1 CE IGUATU",
    "cidade": "Região Prefix 63503"
  },
  {
    "cep": "63503320",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63504",
    "descricaorota": "994-EC1 CE IGUATU",
    "cidade": "Iguatu"
  },
  {
    "cep": "63505",
    "descricaorota": "994-EC1 CE IGUATU",
    "cidade": "Região Prefix 63505"
  },
  {
    "cep": "63505035",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63505585",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63507",
    "descricaorota": "994-EC1 CE IGUATU",
    "cidade": "Região Prefix 63507"
  },
  {
    "cep": "63507260",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63507450",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63507460",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63507667",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63508",
    "descricaorota": "994-EC1 CE IGUATU",
    "cidade": "Região Prefix 63508"
  },
  {
    "cep": "63508070",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63508760",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63508780",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63514",
    "descricaorota": "994-EC1 CE IGUATU",
    "cidade": "Região Prefix 63514"
  },
  {
    "cep": "63514000",
    "descricaorota": "994-EC1 CE IGUATU SAT 4"
  },
  {
    "cep": "63514500",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63514899",
    "descricaorota": "994-EC1 CE IGUATU"
  },
  {
    "cep": "63515",
    "descricaorota": "994-EC1 CE IGUATU SAT 5",
    "cidade": "Região Prefix 63515"
  },
  {
    "cep": "63515000",
    "descricaorota": "994-EC1 CE IGUATU SAT 5"
  },
  {
    "cep": "63527",
    "descricaorota": "994-EC1 CE ICO SAT 4",
    "cidade": "Região Prefix 63527"
  },
  {
    "cep": "63527000",
    "descricaorota": "994-EC1 CE ICO SAT 4"
  },
  {
    "cep": "63530",
    "descricaorota": "994-EC1 CE IGUATU SAT 2",
    "cidade": "Região Prefix 63530"
  },
  {
    "cep": "63530000",
    "descricaorota": "994-EC1 CE IGUATU SAT 2"
  },
  {
    "cep": "63560",
    "descricaorota": "994-EC1 CE IGUATU SAT 1",
    "cidade": "Região Prefix 63560"
  },
  {
    "cep": "63560000",
    "descricaorota": "994-EC1 CE IGUATU SAT 1"
  },
  {
    "cep": "63580",
    "descricaorota": "994-EC1 CE IGUATU SAT 2",
    "cidade": "Região Prefix 63580"
  },
  {
    "cep": "63580000",
    "descricaorota": "994-EC1 CE IGUATU SAT 2"
  },
  {
    "cep": "63585",
    "descricaorota": "994-EC1 CE IGUATU SAT 2",
    "cidade": "Região Prefix 63585"
  },
  {
    "cep": "63585000",
    "descricaorota": "994-EC1 CE IGUATU SAT 2"
  },
  {
    "cep": "63600",
    "descricaorota": "994-EC1 CE QUIXERAMOBIM",
    "cidade": "Região Prefix 63600"
  },
  {
    "cep": "63600000",
    "descricaorota": "994-EC1 CE QUIXERAMOBIM"
  },
  {
    "cep": "63640",
    "descricaorota": "994-EC1 CE CRATEUS SAT 4",
    "cidade": "Região Prefix 63640"
  },
  {
    "cep": "63640000",
    "descricaorota": "994-EC1 CE CRATEUS SAT 4"
  },
  {
    "cep": "63650",
    "descricaorota": "994-EC1 CE CRATEUS SAT 5",
    "cidade": "Região Prefix 63650"
  },
  {
    "cep": "63650000",
    "descricaorota": "994-EC1 CE CRATEUS SAT 5"
  },
  {
    "cep": "63700",
    "descricaorota": "994-EC1 CE CRATEUS",
    "cidade": "Região Prefix 63700"
  },
  {
    "cep": "63700088",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63700106",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63700175",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63700190",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63700415",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63701",
    "descricaorota": "994-EC1 CE CRATEUS",
    "cidade": "Região Prefix 63701"
  },
  {
    "cep": "63701442",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63702",
    "descricaorota": "994-EC1 CE CRATEUS",
    "cidade": "Região Prefix 63702"
  },
  {
    "cep": "63702000",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63702040",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63702065",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63702080",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63702275",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63702860",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63702875",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63702885",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63703",
    "descricaorota": "994-EC1 CE CRATEUS",
    "cidade": "Região Prefix 63703"
  },
  {
    "cep": "63703230",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63704",
    "descricaorota": "994-EC1 CE CRATEUS",
    "cidade": "Região Prefix 63704"
  },
  {
    "cep": "63704015",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63704100",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63705",
    "descricaorota": "994-EC1 CE CRATEUS",
    "cidade": "Região Prefix 63705"
  },
  {
    "cep": "63705035",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63705100",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63705230",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63705440",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63705485",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63705846",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63707",
    "descricaorota": "994-EC1 CE CRATEUS",
    "cidade": "Região Prefix 63707"
  },
  {
    "cep": "63707487",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63707575",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63708",
    "descricaorota": "994-EC1 CE CRATEUS",
    "cidade": "Região Prefix 63708"
  },
  {
    "cep": "63708330",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63708470",
    "descricaorota": "994-EC1 CE CRATEUS"
  },
  {
    "cep": "63715",
    "descricaorota": "994-EC1 CE CRATEUS SAT 1",
    "cidade": "Região Prefix 63715"
  },
  {
    "cep": "63715000",
    "descricaorota": "994-EC1 CE CRATEUS SAT 1"
  },
  {
    "cep": "63725",
    "descricaorota": "994-EC1 CE CRATEUS SAT 2",
    "cidade": "Região Prefix 63725"
  },
  {
    "cep": "63725000",
    "descricaorota": "994-EC1 CE CRATEUS SAT 2"
  },
  {
    "cep": "63736",
    "descricaorota": "994-EC1 CE CRATEUS SAT 1",
    "cidade": "Região Prefix 63736"
  },
  {
    "cep": "63736974",
    "descricaorota": "994-EC1 CE CRATEUS SAT 1"
  },
  {
    "cep": "63740",
    "descricaorota": "994-EC1 CE CRATEUS SAT 5",
    "cidade": "Região Prefix 63740"
  },
  {
    "cep": "63740000",
    "descricaorota": "994-EC1 CE CRATEUS SAT 5"
  },
  {
    "cep": "63800",
    "descricaorota": "994-EC1 CE QUIXERAMOBIM",
    "cidade": "Região Prefix 63800"
  },
  {
    "cep": "63800000",
    "descricaorota": "994-EC1 CE QUIXERAMOBIM"
  },
  {
    "cep": "63802",
    "descricaorota": "994-EC1 CE QUIXERAMOBIM SAT 2",
    "cidade": "Região Prefix 63802"
  },
  {
    "cep": "63802976",
    "descricaorota": "994-EC1 CE QUIXERAMOBIM SAT 2"
  },
  {
    "cep": "63900",
    "descricaorota": "994-EC1 CE QUIXADA",
    "cidade": "Região Prefix 63900"
  },
  {
    "cep": "63900053",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63900089",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63900125",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63900195",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63900207",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63900217",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63900231",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63900375",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63900455",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63901",
    "descricaorota": "994-EC1 CE QUIXADA",
    "cidade": "Região Prefix 63901"
  },
  {
    "cep": "63901035",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63901155",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63902",
    "descricaorota": "994-EC1 CE QUIXADA",
    "cidade": "Região Prefix 63902"
  },
  {
    "cep": "63902150",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63902240",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63902245",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63902285",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63902315",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63902740",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63902745",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63902747",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63902780",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63902878",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63905",
    "descricaorota": "994-EC1 CE QUIXADA",
    "cidade": "Região Prefix 63905"
  },
  {
    "cep": "63905040",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63905250",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63905395",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63905420",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63905445",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63905465",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63907",
    "descricaorota": "994-EC1 CE QUIXADA",
    "cidade": "Região Prefix 63907"
  },
  {
    "cep": "63907055",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63907190",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63908",
    "descricaorota": "994-EC1 CE QUIXADA",
    "cidade": "Região Prefix 63908"
  },
  {
    "cep": "63908110",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63908163",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63908180",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63908330",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63908370",
    "descricaorota": "994-EC1 CE QUIXADA"
  },
  {
    "cep": "63915",
    "descricaorota": "994-EC1 CE QUIXADA SAT 2",
    "cidade": "Região Prefix 63915"
  },
  {
    "cep": "63915000",
    "descricaorota": "994-EC1 CE QUIXADA SAT 2"
  },
  {
    "cep": "63920",
    "descricaorota": "994-EC1 CE QUIXADA SAT 1",
    "cidade": "Região Prefix 63920"
  },
  {
    "cep": "63920000",
    "descricaorota": "994-EC1 CE QUIXADA SAT 1"
  },
  {
    "cep": "63927",
    "descricaorota": "994-EC1 CE QUIXADA SAT 4",
    "cidade": "Região Prefix 63927"
  },
  {
    "cep": "63927000",
    "descricaorota": "994-EC1 CE QUIXADA SAT 4"
  },
  {
    "cep": "63950",
    "descricaorota": "994-EC1 CE QUIXADA SAT 2",
    "cidade": "Região Prefix 63950"
  },
  {
    "cep": "63950000",
    "descricaorota": "994-EC1 CE QUIXADA SAT 2"
  },
  {
    "cep": "63953",
    "descricaorota": "994-EC1 CE QUIXADA SAT 2",
    "cidade": "Região Prefix 63953"
  },
  {
    "cep": "63953975",
    "descricaorota": "994-EC1 CE QUIXADA SAT 2"
  },
  {
    "cep": "63960",
    "descricaorota": "994-EC1 CE QUIXADA SAT 4",
    "cidade": "Região Prefix 63960"
  },
  {
    "cep": "63960000",
    "descricaorota": "994-EC1 CE QUIXADA SAT 4"
  },
  {
    "cep": "63970",
    "descricaorota": "994-EC1 CE QUIXADA SAT 5",
    "cidade": "Região Prefix 63970"
  },
  {
    "cep": "63970000",
    "descricaorota": "994-EC1 CE QUIXADA SAT 5"
  },
  {
    "cep": "68035",
    "descricaorota": "994-EC1 CE TIANGUA",
    "cidade": "Região Prefix 68035"
  },
  {
    "cep": "68035105",
    "descricaorota": "994-EC1 CE TIANGUA"
  }
]
