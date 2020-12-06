import {Observable} from "rxjs";
import {NodeMap} from "../engine/node-watch";

export class NodeRegistryApiMirror {
    nodeMap$: Observable<NodeMap>
}
