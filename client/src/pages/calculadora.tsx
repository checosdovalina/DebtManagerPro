import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, RefreshCw, Info } from "lucide-react";

const MXNF = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const PCT = (n: number) => `${n.toFixed(4)}%`;

interface ResultRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export default function CalculadoraPage() {
  // Interés simple / moratorio
  const [capital, setCapital] = useState("");
  const [tasa, setTasa] = useState("");
  const [periodo, setPeriodo] = useState("30");
  const [tipoPeriodo, setTipoPeriodo] = useState("dias");
  const [tipoTasa, setTipoTasa] = useState("mensual");
  const [resultSimple, setResultSimple] = useState<ResultRow[] | null>(null);

  // Interés compuesto
  const [capitalC, setCapitalC] = useState("");
  const [tasaC, setTasaC] = useState("");
  const [periodosC, setPeriodosC] = useState("12");
  const [capitalizacion, setCapitalizacion] = useState("mensual");
  const [resultCompuesto, setResultCompuesto] = useState<ResultRow[] | null>(null);

  // Total con pagos parciales
  const [deudaOrig, setDeudaOrig] = useState("");
  const [pagosRealizados, setPagosRealizados] = useState("");
  const [tasaMora, setTasaMora] = useState("");
  const [diasMora, setDiasMora] = useState("");
  const [resultMora, setResultMora] = useState<ResultRow[] | null>(null);

  const calcularSimple = () => {
    const C = parseFloat(capital.replace(/,/g, ""));
    const r = parseFloat(tasa) / 100;
    const n = parseFloat(periodo);
    if (isNaN(C) || isNaN(r) || isNaN(n)) return;

    let tasaDiaria: number;
    if (tipoTasa === "anual") tasaDiaria = r / 365;
    else if (tipoTasa === "mensual") tasaDiaria = r / 30;
    else tasaDiaria = r;

    let dias: number;
    if (tipoPeriodo === "dias") dias = n;
    else if (tipoPeriodo === "semanas") dias = n * 7;
    else if (tipoPeriodo === "meses") dias = n * 30;
    else dias = n * 365;

    const interes = C * tasaDiaria * dias;
    const total = C + interes;

    setResultSimple([
      { label: "Capital inicial", value: MXNF(C) },
      { label: "Tasa diaria equivalente", value: PCT(tasaDiaria * 100) },
      { label: "Días de cálculo", value: `${dias} días` },
      { label: "Interés generado", value: MXNF(interes), highlight: true },
      { label: "Total a pagar", value: MXNF(total), highlight: true },
    ]);
  };

  const calcularCompuesto = () => {
    const C = parseFloat(capitalC.replace(/,/g, ""));
    const r = parseFloat(tasaC) / 100;
    const n = parseFloat(periodosC);
    if (isNaN(C) || isNaN(r) || isNaN(n)) return;

    const frecMap: Record<string, number> = { diaria: 365, semanal: 52, mensual: 12, trimestral: 4, anual: 1 };
    const m = frecMap[capitalizacion] || 12;
    const tasaPeriodo = r / m;

    const total = C * Math.pow(1 + tasaPeriodo, n);
    const interes = total - C;

    setResultCompuesto([
      { label: "Capital inicial", value: MXNF(C) },
      { label: "Tasa por período", value: PCT(tasaPeriodo * 100) },
      { label: "Períodos", value: `${n}` },
      { label: "Intereses acumulados", value: MXNF(interes), highlight: true },
      { label: "Total a pagar", value: MXNF(total), highlight: true },
    ]);
  };

  const calcularMora = () => {
    const D = parseFloat(deudaOrig.replace(/,/g, ""));
    const P = parseFloat(pagosRealizados.replace(/,/g, "") || "0");
    const r = parseFloat(tasaMora) / 100 / 30;
    const dias = parseFloat(diasMora);
    if (isNaN(D) || isNaN(r) || isNaN(dias)) return;

    const saldo = D - P;
    const mora = saldo * r * dias;
    const total = saldo + mora;

    setResultMora([
      { label: "Deuda original", value: MXNF(D) },
      { label: "Pagos realizados", value: MXNF(P) },
      { label: "Saldo insoluto", value: MXNF(saldo) },
      { label: "Días en mora", value: `${dias}` },
      { label: "Intereses moratorios", value: MXNF(mora), highlight: true },
      { label: "Total exigible", value: MXNF(total), highlight: true },
    ]);
  };

  const ResultTable = ({ rows }: { rows: ResultRow[] }) => (
    <div className="mt-4 rounded-lg border overflow-hidden">
      {rows.map((r, i) => (
        <div key={i}
          className={`flex justify-between items-center px-4 py-2.5 text-sm ${
            r.highlight ? "bg-primary-50 font-semibold text-primary-700" : "bg-white"
          } ${i > 0 ? "border-t" : ""}`}
        >
          <span className="text-gray-600">{r.label}</span>
          <span>{r.value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Layout title="Calculadora de Intereses">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary-50 rounded-lg">
          <Calculator className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculadora de Intereses</h1>
          <p className="text-sm text-gray-500">Calcula intereses simples, compuestos y moratorios</p>
        </div>
      </div>

      <Tabs defaultValue="simple" className="space-y-4">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="simple">
            <TrendingUp className="h-4 w-4 mr-2" />
            Interés Simple
          </TabsTrigger>
          <TabsTrigger value="compuesto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Interés Compuesto
          </TabsTrigger>
          <TabsTrigger value="mora">
            <Info className="h-4 w-4 mr-2" />
            Mora con Abonos
          </TabsTrigger>
        </TabsList>

        {/* SIMPLE */}
        <TabsContent value="simple">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Interés Simple / Ordinario</CardTitle>
                <CardDescription>I = C × r × t</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Capital (MXN)</Label>
                  <Input placeholder="50,000" value={capital}
                    onChange={e => setCapital(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tasa (%)</Label>
                    <Input placeholder="2.5" value={tasa} onChange={e => setTasa(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo de tasa</Label>
                    <Select value={tipoTasa} onValueChange={setTipoTasa}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diaria">Diaria</SelectItem>
                        <SelectItem value="mensual">Mensual</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Período</Label>
                    <Input placeholder="30" value={periodo} onChange={e => setPeriodo(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unidad</Label>
                    <Select value={tipoPeriodo} onValueChange={setTipoPeriodo}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dias">Días</SelectItem>
                        <SelectItem value="semanas">Semanas</SelectItem>
                        <SelectItem value="meses">Meses</SelectItem>
                        <SelectItem value="anos">Años</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" onClick={calcularSimple}>Calcular</Button>
                {resultSimple && <ResultTable rows={resultSimple} />}
              </CardContent>
            </Card>

            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  ¿Cómo funciona?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p><strong>Fórmula:</strong> I = C × r × t</p>
                <Separator />
                <ul className="space-y-2">
                  <li>• <strong>C</strong> = Capital o saldo insoluto</li>
                  <li>• <strong>r</strong> = Tasa de interés por período</li>
                  <li>• <strong>t</strong> = Tiempo (en unidad de la tasa)</li>
                </ul>
                <Separator />
                <p className="text-xs text-gray-500">
                  El interés se calcula automáticamente convirtiendo la tasa a tasa diaria según el tipo seleccionado (anual ÷ 365, mensual ÷ 30).
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* COMPUESTO */}
        <TabsContent value="compuesto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Interés Compuesto</CardTitle>
                <CardDescription>M = C × (1 + r/m)^n</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Capital (MXN)</Label>
                  <Input placeholder="100,000" value={capitalC}
                    onChange={e => setCapitalC(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tasa anual (%)</Label>
                    <Input placeholder="24" value={tasaC} onChange={e => setTasaC(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Capitalización</Label>
                    <Select value={capitalizacion} onValueChange={setCapitalizacion}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diaria">Diaria</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensual">Mensual</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Número de períodos</Label>
                  <Input placeholder="12" value={periodosC}
                    onChange={e => setPeriodosC(e.target.value)} />
                </div>
                <Button className="w-full" onClick={calcularCompuesto}>Calcular</Button>
                {resultCompuesto && <ResultTable rows={resultCompuesto} />}
              </CardContent>
            </Card>

            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  ¿Cómo funciona?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p><strong>Fórmula:</strong> M = C × (1 + r/m)ⁿ</p>
                <Separator />
                <ul className="space-y-2">
                  <li>• <strong>C</strong> = Capital inicial</li>
                  <li>• <strong>r</strong> = Tasa anual nominal</li>
                  <li>• <strong>m</strong> = Frecuencia de capitalización</li>
                  <li>• <strong>n</strong> = Número de períodos</li>
                </ul>
                <Separator />
                <p className="text-xs text-gray-500">
                  En el interés compuesto, los intereses generados se suman al capital en cada período, generando intereses sobre intereses.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MORA */}
        <TabsContent value="mora">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cálculo de Mora con Abonos</CardTitle>
                <CardDescription>Saldo insoluto + intereses moratorios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Deuda original (MXN)</Label>
                  <Input placeholder="80,000" value={deudaOrig}
                    onChange={e => setDeudaOrig(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Pagos realizados (MXN)</Label>
                  <Input placeholder="10,000" value={pagosRealizados}
                    onChange={e => setPagosRealizados(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tasa moratoria mensual (%)</Label>
                    <Input placeholder="3.5" value={tasaMora}
                      onChange={e => setTasaMora(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Días en mora</Label>
                    <Input placeholder="90" value={diasMora}
                      onChange={e => setDiasMora(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full" onClick={calcularMora}>Calcular total exigible</Button>
                {resultMora && <ResultTable rows={resultMora} />}
              </CardContent>
            </Card>

            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Notas importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0">Art. 362 CCo</Badge>
                  <p>El interés legal mercantil en México es del 6% anual cuando no se pacte tasa.</p>
                </div>
                <Separator />
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0">SCJN</Badge>
                  <p>Tasas por encima del 300% anual pueden declararse usurarias por los tribunales.</p>
                </div>
                <Separator />
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0">Tip</Badge>
                  <p>Los abonos se aplican primero a intereses vencidos y luego a capital (salvo pacto contrario).</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
